'use client';

import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { exportToCsv } from '../../lib/exportCsv';
import { SkeletonList } from './SkeletonGrid';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  defaultVisible?: boolean;
  exportValue?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  getSearchText?: (row: T) => string;
  filters?: DataTableFilter[];
  pageSize?: number;
  emptyMessage?: string;
  exportFilename?: string;
  rowKey?: (row: T) => string;
}

type SortDir = 'asc' | 'desc';

function getCellExportValue<T>(row: T, col: DataTableColumn<T>): string {
  if (col.exportValue) return String(col.exportValue(row));
  const val = row[col.key];
  return val != null ? String(val) : '';
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  searchPlaceholder = 'Search...',
  getSearchText,
  filters = [],
  pageSize = 10,
  emptyMessage = 'No records found',
  exportFilename = 'export',
  rowKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columns.map((c) => [c.key, c.defaultVisible !== false]))
  );

  const displayedColumns = columns.filter((c) => visibleColumns[c.key]);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) => {
        const text = getSearchText ? getSearchText(row) : JSON.stringify(row).toLowerCase();
        return text.toLowerCase().includes(q);
      });
    }

    filters.forEach((f) => {
      const val = activeFilters[f.key];
      if (val && val !== 'all' && val !== '') {
        result = result.filter((row) => String(row[f.key] ?? '') === val);
      }
    });

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      result.sort((a, b) => {
        const aVal = String(col?.exportValue ? col.exportValue(a) : a[sortKey] ?? '');
        const bVal = String(col?.exportValue ? col.exportValue(b) : b[sortKey] ?? '');
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, sortKey, sortDir, activeFilters, filters, columns, getSearchText]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const handleExport = () => {
    const exportCols = displayedColumns.map((c) => ({ key: c.key, label: c.label }));
    const rows = filteredData.map((row) => {
      const out: Record<string, unknown> = {};
      displayedColumns.forEach((c) => {
        out[c.key] = getCellExportValue(row, c);
      });
      return out;
    });
    exportToCsv(rows, exportCols, exportFilename);
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const visibleCount = Object.values(prev).filter(Boolean).length;
      if (prev[key] && visibleCount <= 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const resetFilters = () => {
    setSearch('');
    setActiveFilters({});
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="bg-[#131b2e] border border-slate-800 rounded-[16px] p-6">
        <SkeletonList rows={5} />
      </div>
    );
  }

  return (
    <div className="bg-[#131b2e] border border-slate-800 rounded-[16px] shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 sm:p-6 border-b border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              aria-label="Search table"
              className="flex-1 min-w-0 bg-slate-900 border border-slate-800 text-sm px-4 py-2.5 rounded-[12px] text-white outline-none focus:ring-1 focus:ring-blue-500"
            />

            {filters.map((f) => (
              <select
                key={f.key}
                value={activeFilters[f.key] || 'all'}
                onChange={(e) => {
                  setActiveFilters((prev) => ({ ...prev, [f.key]: e.target.value }));
                  setCurrentPage(1);
                }}
                aria-label={`Filter by ${f.label}`}
                className="bg-slate-900 border border-slate-800 text-sm px-3 py-2.5 rounded-[12px] text-white outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
              >
                <option value="all">All {f.label}</option>
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white border border-slate-800 rounded-[12px] hover:bg-slate-800 transition-all"
            >
              Reset
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnMenu((v) => !v)}
                className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 border border-slate-800 rounded-[12px] hover:bg-slate-800 transition-all"
              >
                Columns
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f1628] border border-slate-800 rounded-[12px] shadow-2xl z-20 p-2">
                  {columns.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-[8px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key]}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-slate-600"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={filteredData.length === 0}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] disabled:opacity-40 transition-all"
            >
              Export CSV
            </button>
          </div>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Showing {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-touch">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/50 border-b border-slate-800">
            <tr>
              {displayedColumns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 sm:px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest ${col.headerClassName || ''}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-blue-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={displayedColumns.length} className="px-6 py-16 text-center text-slate-500 text-sm font-semibold">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={rowKey ? rowKey(row) : idx} className="hover:bg-slate-900/30 transition-colors">
                  {displayedColumns.map((col) => (
                    <td key={col.key} className={`px-4 sm:px-6 py-4 text-slate-200 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-[12px] text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-35 transition-all"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-[12px] text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-35 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
