'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { generateWifiQrString } from '@/lib/wifi-qr';

export default function StaffGuidePrintPage() {
  const [ssid, setSsid] = useState('TheVelvetLounge_Staff');
  const [password, setPassword] = useState('StaffPass@2026');
  const [security, setSecurity] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  const [wifiQrDataUrl, setWifiQrDataUrl] = useState<string>('');
  const [staffQrDataUrl, setStaffQrDataUrl] = useState<string>('');
  const [staffUrl, setStaffUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/staff`;
      setStaffUrl(url);

      QRCode.toDataURL(url, { width: 300, margin: 1 })
        .then(setStaffQrDataUrl)
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    const wifiString = generateWifiQrString({ ssid, password, security });
    QRCode.toDataURL(wifiString, { width: 300, margin: 1 })
      .then(setWifiQrDataUrl)
      .catch(console.error);
  }, [ssid, password, security]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Cấu hình không in khi ấn lệnh print */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Tạo Tờ Hướng Dẫn & Wi-Fi Cho Nhân Viên (A5)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thông tin Wi-Fi chỉ được sinh mã QR trực tiếp trên trình duyệt, tuyệt đối KHÔNG lưu vào Database.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
          >
            🖨️ In Tờ Hướng Dẫn (A5)
          </button>
        </div>

        {/* Biểu mẫu cấu hình Wi-Fi */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
              Tên Wi-Fi (SSID)
            </label>
            <input
              type="text"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
              Mật khẩu Wi-Fi
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={security === 'nopass'}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
              Loại bảo mật
            </label>
            <select
              value={security}
              onChange={(e) => setSecurity(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="WPA">WPA / WPA2 / WPA3 (Khuyên dùng)</option>
              <option value="WEP">WEP</option>
              <option value="nopass">Không có mật khẩu</option>
            </select>
          </div>
        </div>

        {/* Cảnh báo bảo mật */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <span>⚠️</span> Khuyến nghị bảo mật & mạng nội bộ:
          </p>
          <p className="text-[11px] leading-relaxed">
            - Nên dùng mạng Wi-Fi riêng cho nhân viên, tách biệt khỏi mạng khách và máy POS/thanh toán.
            <br />
            - <strong>Không dán tờ này ở nơi khách nhìn thấy</strong> để tránh lộ mật khẩu nội bộ.
            <br />
            - <em>Ghi chú:</em> Nếu hệ thống triển khai trên Cloud/VPS, nhân viên dùng 4G vẫn truy cập được bình thường; Wi-Fi giúp đường truyền ổn định và tiết kiệm dữ liệu.
          </p>
        </div>
      </div>

      {/* BỐ CỤC IN KHỔ A5 CHUẨN (148mm x 210mm) */}
      <div className="flex justify-center">
        <div className="w-[148mm] min-h-[210mm] bg-white text-slate-900 p-8 shadow-2xl rounded-2xl border border-slate-200 print:border-none print:shadow-none print:p-6 print:m-0 flex flex-col justify-between text-center font-sans">
          {/* Header tờ in */}
          <div className="space-y-1 border-b-2 border-slate-900 pb-4">
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
              The Velvet Lounge
            </h2>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
              HƯỚNG DẪN KẾT NỐI DÀNH CHO NHÂN VIÊN
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Tài Liệu Nội Bộ • Không Phổ Biến Cho Khách Hàng
            </p>
          </div>

          {/* 2 Mã QR cạnh nhau */}
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Cột 1: QR Wi-Fi */}
            <div className="flex flex-col items-center p-3 rounded-xl border-2 border-slate-900 bg-slate-50">
              <span className="text-[11px] font-bold uppercase text-slate-800 mb-1">
                [1] Quét Kết Nối Wi-Fi
              </span>
              <div className="w-36 h-36 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center">
                {wifiQrDataUrl ? (
                  <img src={wifiQrDataUrl} alt="QR WiFi" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">Đang tạo...</span>
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-900 mt-2 truncate max-w-[130px]">
                {ssid}
              </p>
              <p className="text-[10px] text-slate-600 font-mono">
                {security !== 'nopass' ? `Pass: ${password}` : 'Không mật khẩu'}
              </p>
            </div>

            {/* Cột 2: QR App Nhân Viên */}
            <div className="flex flex-col items-center p-3 rounded-xl border-2 border-slate-900 bg-slate-50">
              <span className="text-[11px] font-bold uppercase text-slate-800 mb-1">
                [2] Quét Mở Ứng Dụng
              </span>
              <div className="w-36 h-36 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center">
                {staffQrDataUrl ? (
                  <img src={staffQrDataUrl} alt="QR Staff" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">Đang tạo...</span>
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-900 mt-2">
                Cổng Phục Vụ Staff
              </p>
              <p className="text-[10px] text-slate-600 truncate max-w-[130px]">
                {staffUrl}
              </p>
            </div>
          </div>

          {/* Các bước hướng dẫn ngắn gọn */}
          <div className="text-left bg-slate-100 p-4 rounded-xl border border-slate-300 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">
              5 Bước Bắt Đầu Làm Việc:
            </h4>
            <ol className="space-y-1.5 text-[11px] text-slate-800 list-decimal list-inside font-medium leading-relaxed">
              <li>
                <strong>Quét mã QR [1]</strong> để kết nối tự động vào mạng Wi-Fi nội bộ của quán.
              </li>
              <li>
                <strong>Quét mã QR [2]</strong> hoặc truy cập đường dẫn trang web trên Safari/Chrome.
              </li>
              <li>
                <strong>Thêm vào Màn hình chính</strong> (Add to Home Screen) để dùng như app và nhận thông báo.
              </li>
              <li>
                <strong>Đăng nhập</strong> bằng tài khoản email & mật khẩu được quản lý cấp.
              </li>
              <li>
                Nhấn nút <strong>&quot;Bắt đầu ca&quot;</strong> và cho phép nhận thông báo để không bỏ sót đơn.
              </li>
            </ol>
          </div>

          {/* Footer tờ in */}
          <div className="pt-3 border-t border-slate-300 text-[9px] text-slate-500 flex items-center justify-between">
            <span>Hệ Thống QR Order • Bar & Lounge</span>
            <span>Hỗ trợ kỹ thuật: Liên hệ Quản lý ca</span>
          </div>
        </div>
      </div>
    </div>
  );
}
