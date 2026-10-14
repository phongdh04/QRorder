import { describe, it, expect } from 'vitest';
import { escapeWifiString, generateWifiQrString } from '../src/lib/wifi-qr';

describe('Part 10 - Wi-Fi QR Code Generator & Special Character Escaping', () => {
  it('thoát đúng ký tự backslash (\\)', () => {
    expect(escapeWifiString('My\\Network')).toBe('My\\\\Network');
  });

  it('thoát đúng các ký tự đặc biệt: dấu chấm phẩy (;), dấu phẩy (,), dấu hai chấm (:), và dấu ngoặc kép (")', () => {
    expect(escapeWifiString('Net;work,with:all"chars')).toBe('Net\\;work\\,with\\:all\\"chars');
  });

  it('kết hợp thoát phức tạp: backslash và các ký tự đặc biệt theo đúng thứ tự', () => {
    // Nếu có backslash và semicolon, backslash phải được escape trước để không escape nhầm dấu escape
    const raw = 'Pass\\word;with:special,symbols"and\\more';
    const escaped = escapeWifiString(raw);
    expect(escaped).toBe('Pass\\\\word\\;with\\:special\\,symbols\\"and\\\\more');
  });

  it('sinh chuỗi QR Wi-Fi đúng chuẩn WIFI:T:<security>;S:<ssid>;P:<password>;; cho WPA', () => {
    const qrString = generateWifiQrString({
      ssid: 'The Velvet Lounge - Staff',
      password: 'Secret;Password\\123',
      security: 'WPA',
      hidden: false,
    });

    expect(qrString).toBe(
      'WIFI:T:WPA;S:The Velvet Lounge - Staff;P:Secret\\;Password\\\\123;;'
    );
  });

  it('sinh chuỗi QR Wi-Fi đúng chuẩn cho mạng không mật khẩu (nopass)', () => {
    const qrString = generateWifiQrString({
      ssid: 'Free_Guest_WiFi',
      security: 'nopass',
      hidden: false,
    });

    expect(qrString).toBe('WIFI:T:nopass;S:Free_Guest_WiFi;;');
  });

  it('thêm cờ H:true nếu mạng là SSID ẩn (hidden network)', () => {
    const qrString = generateWifiQrString({
      ssid: 'Hidden_Bar_Network',
      password: 'SafePassWord:999',
      security: 'WPA',
      hidden: true,
    });

    expect(qrString).toBe('WIFI:T:WPA;S:Hidden_Bar_Network;P:SafePassWord\\:999;H:true;;');
  });
});
