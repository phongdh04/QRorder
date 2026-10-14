import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { StorageAdapter } from './types';

export interface S3StorageConfig {
  endpoint?: string;
  region?: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicAssetBaseUrl?: string;
  forcePathStyle?: boolean;
}

/**
 * Bản triển khai lưu trữ tương thích S3 (Cloudflare R2, MinIO, AWS S3)
 */
export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private publicAssetBaseUrl: string;
  private endpoint: string;

  constructor(config?: Partial<S3StorageConfig>) {
    const endpoint = config?.endpoint || process.env.S3_ENDPOINT || '';
    const region = config?.region || process.env.S3_REGION || 'auto';
    const bucket = config?.bucket || process.env.S3_BUCKET || 'qrorder-media';
    const accessKeyId = config?.accessKeyId || process.env.S3_ACCESS_KEY_ID || '';
    const secretAccessKey = config?.secretAccessKey || process.env.S3_SECRET_ACCESS_KEY || '';
    const publicAssetBaseUrl = (
      config?.publicAssetBaseUrl !== undefined
        ? config.publicAssetBaseUrl
        : (process.env.PUBLIC_ASSET_BASE_URL || '')
    ).trim();

    // Tự động nhận diện cấu hình forcePathStyle cho MinIO / Localhost
    const isLocalOrMinio =
      endpoint.includes('localhost') ||
      endpoint.includes('127.0.0.1') ||
      endpoint.includes('minio') ||
      process.env.S3_FORCE_PATH_STYLE === 'true';

    const forcePathStyle =
      config?.forcePathStyle !== undefined ? config.forcePathStyle : isLocalOrMinio;

    this.bucket = bucket;
    this.endpoint = endpoint;
    this.publicAssetBaseUrl = publicAssetBaseUrl;

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle,
    });
  }

  /**
   * Tải tệp lên S3 / R2 / MinIO kèm Cache-Control tối ưu
   */
  async put(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await this.client.send(command);
  }

  /**
   * Xóa tệp khỏi S3 / R2 / MinIO
   */
  async delete(key: string): Promise<void> {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });

    await this.client.send(command);
  }

  /**
   * Kiểm tra tệp có tồn tại trên S3 hay không
   */
  async exists(key: string): Promise<boolean> {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      await this.client.send(command);
      return true;
    } catch (err: any) {
      if (
        err.name === 'NotFound' ||
        err.$metadata?.httpStatusCode === 404 ||
        err.name === 'NoSuchKey'
      ) {
        return false;
      }
      throw err;
    }
  }

  /**
   * Tải tệp nhị phân từ S3 (phục vụ backup / migration)
   */
  async get(key: string): Promise<Buffer | null> {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });

      const response = await this.client.send(command);
      if (!response.Body) return null;

      const byteArray = await response.Body.transformToByteArray();
      return Buffer.from(byteArray);
    } catch (err: any) {
      if (
        err.name === 'NoSuchKey' ||
        err.name === 'NotFound' ||
        err.$metadata?.httpStatusCode === 404
      ) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Lấy URL công khai của tệp
   */
  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');

    if (this.publicAssetBaseUrl) {
      const baseUrl = this.publicAssetBaseUrl.replace(/\/$/, '');
      return `${baseUrl}/${cleanKey}`;
    }

    if (this.endpoint) {
      const cleanEndpoint = this.endpoint.replace(/\/$/, '');
      return `${cleanEndpoint}/${this.bucket}/${cleanKey}`;
    }

    return `https://${this.bucket}.s3.amazonaws.com/${cleanKey}`;
  }

  /**
   * Liệt kê tất cả các tệp trong bucket S3 (tự động phân trang)
   */
  async list(prefix = ''): Promise<string[]> {
    const cleanPrefix = prefix.replace(/\\/g, '/').replace(/^\/+/, '');
    const results: string[] = [];
    let continuationToken: string | undefined = undefined;

    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: cleanPrefix || undefined,
        ContinuationToken: continuationToken,
      });

      const response: ListObjectsV2CommandOutput = await this.client.send(command);
      if (response.Contents) {
        for (const item of response.Contents) {
          if (item.Key) {
            results.push(item.Key);
          }
        }
      }
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return results;
  }
}
