/**
 * Helper sinh chuỗi QR Code kết nối Wi-Fi chuẩn quốc tế:
 * WIFI:T:<loại_bảo_mật>;S:<tên_mạng>;P:<mật_khẩu>;H:<ẩn>;;
 *
 * Yêu cầu chuẩn: Thoát đúng các ký tự đặc biệt (\ ; , : ")
 */

export function escapeWifiString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/:/g, '\\:')
    .replace(/"/g, '\\"');
}

export interface WifiConfig {
  ssid: string;
  password?: string;
  security?: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export function generateWifiQrString(config: WifiConfig): string {
  const { ssid, password = '', security = 'WPA', hidden = false } = config;
  const escapedSsid = escapeWifiString(ssid);
  const escapedPassword = escapeWifiString(password);
  const hiddenPart = hidden ? 'H:true;' : '';

  if (security === 'nopass') {
    return `WIFI:T:nopass;S:${escapedSsid};${hiddenPart};`;
  }

  return `WIFI:T:${security};S:${escapedSsid};P:${escapedPassword};${hiddenPart};`;
}
