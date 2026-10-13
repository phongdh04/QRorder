'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Download, Printer, Copy, Check, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  token: string;
}

export function QRCodeModal({ isOpen, onClose, tableName, token }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Xây dựng URL khách quét mã
  const tableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/t/${token}`
    : `/t/${token}`;

  useEffect(() => {
    if (token && isOpen) {
      QRCode.toDataURL(tableUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Lỗi sinh mã QR:', err));
    }
  }, [token, isOpen, tableUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(tableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${tableName.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 w-full max-w-sm bg-[#0c101a] border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Mã QR Gọi Món</h3>
                  <p className="text-xs text-amber-400 font-semibold">{tableName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Card for printing */}
            <div className="bg-white p-5 rounded-2xl shadow-inner mx-auto space-y-3">
              <p className="text-slate-900 font-black text-sm uppercase tracking-wider">
                The Velvet Lounge
              </p>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Mã QR ${tableName}`}
                  className="w-52 h-52 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-52 h-52 mx-auto bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  Đang tạo mã QR...
                </div>
              )}
              <div className="bg-slate-900 text-amber-400 py-1.5 px-3 rounded-lg text-xs font-black">
                {tableName} • QUÉT ĐỂ GỌI MÓN
              </div>
            </div>

            {/* URL display */}
            <div className="text-left bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
              <p className="text-[11px] text-slate-500">Đường dẫn trực tiếp:</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-300 truncate font-mono">{tableUrl}</span>
                <button
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-amber-400 p-1 shrink-0"
                  title="Sao chép"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleDownload} className="text-xs gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>Tải ảnh PNG</span>
              </Button>
              <a href={tableUrl} target="_blank" rel="noreferrer" className="w-full">
                <Button variant="gold" size="sm" className="w-full text-xs gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở thử bàn</span>
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
