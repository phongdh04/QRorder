'use client';

import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { TableCard, TableItemData } from './TableCard';

interface TableGridProps {
  tables: TableItemData[];
  selectedTableId: string | null;
  onSelectTable: (table: TableItemData) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function TableGrid({
  tables,
  selectedTableId,
  onSelectTable,
  isLoading = false,
  onRefresh,
}: TableGridProps) {
  const [filter, setFilter] = useState<'all' | 'occupied' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Lọc danh sách bàn
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      // Tìm kiếm theo tên
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        if (!table.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Bộ lọc nhanh
      if (filter === 'occupied') {
        return table.statusType !== 'empty';
      }
      if (filter === 'pending') {
        return table.statusType === 'pending';
      }

      return true;
    });
  }, [tables, filter, searchQuery]);

  // Đếm số lượng theo trạng thái
  const counts = useMemo(() => {
    return {
      all: tables.length,
      occupied: tables.filter((t) => t.statusType !== 'empty').length,
      pending: tables.filter((t) => t.statusType === 'pending').length,
    };
  }, [tables]);

  return (
    <div className="space-y-4">
      {/* 1. Chú thích màu trạng thái (Legend) */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-3 md:gap-5 text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Chú thích:</span>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Trống (xám)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Có khách (xanh)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span>Có đơn mới (cam)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Đang làm (vàng)</span>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto"
            title="Làm mới danh sách bàn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}
      </div>

      {/* 2. Thanh lọc nhanh & Ô tìm kiếm */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Bộ lọc nhanh */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tất cả ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter('occupied')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'occupied'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Có khách ({counts.occupied})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              filter === 'pending'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Có đơn mới</span>
            {counts.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping inline-block" />
            )}
            <span>({counts.pending})</span>
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bàn..."
            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* 3. Lưới các ô bàn */}
      {isLoading && tables.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[142px] bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-2 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Không tìm thấy bàn nào phù hợp
          </p>
          <p className="text-xs text-slate-400">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc chuyển bộ lọc về &quot;Tất cả&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              isSelected={selectedTableId === table.id}
              onClick={() => onSelectTable(table)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
