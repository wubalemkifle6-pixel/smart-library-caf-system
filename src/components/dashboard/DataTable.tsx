"use client";
import { useState, useEffect, type ReactNode } from "react";
import { Card, CardBody, Button, Input, Select, Badge, EmptyState, LoadingSpinner, StatusBadge } from "@/components/ui";
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T extends { id: number }> {
  title: string;
  description?: string;
  columns: ColumnDef<T>[];
  endpoint: string;
  searchPlaceholder?: string;
  filters?: Array<{ key: string; label: string; options: Array<{ value: string; label: string }> }>;
  createButtonText?: string;
  onCreate?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  actions?: (row: T) => ReactNode;
  refreshKey?: number;
}

export function DataTable<T extends { id: number }>({
  title, description, columns, endpoint, searchPlaceholder = "Search...",
  filters = [], createButtonText, onCreate, onEdit, onDelete, onView,
  actions, refreshKey,
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), pageSize: String(pageSize), search,
    });
    Object.entries(filterValues).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    fetch(`${endpoint}?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setData(res.data.items);
          setTotal(res.data.total);
          setTotalPages(res.data.totalPages);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, filterValues, refreshKey]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <Card>
      <div className="p-5 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
          {onCreate && (
            <Button size="sm" onClick={onCreate}>
              <Plus size={16} /> {createButtonText || "Add New"}
            </Button>
          )}
        </div>
        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-100 text-sm"
            />
          </div>
          {filters.map(f => (
            <select
              key={f.key}
              value={filterValues[f.key] || ""}
              onChange={e => { setFilterValues(prev => ({ ...prev, [f.key]: e.target.value })); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-300 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-100 text-sm bg-white"
            >
              <option value="">{f.label}</option>
              {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
          <Button type="submit" size="md" variant="secondary">Search</Button>
        </form>
      </div>

      {loading ? (
        <div className="p-10"><LoadingSpinner /></div>
      ) : data.length === 0 ? (
        <EmptyState title="No records found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {columns.map(c => (
                    <th key={c.key} className={cn("text-left px-5 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider", c.className)}>
                      {c.label}
                    </th>
                  ))}
                  {(onEdit || onDelete || onView || actions) && (
                    <th className="text-right px-5 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    {columns.map(c => (
                      <td key={c.key} className={cn("px-5 py-3.5 text-slate-700", c.className)}>
                        {c.render ? c.render(row) : (row as any)[c.key]}
                      </td>
                    ))}
                    {(onEdit || onDelete || onView || actions) && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          {onView && (
                            <button onClick={() => onView(row)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600" title="View">
                              <Eye size={15} />
                            </button>
                          )}
                          {onEdit && (
                            <button onClick={() => onEdit(row)} className="p-1.5 rounded hover:bg-navy-50 text-navy-700" title="Edit">
                              <Pencil size={15} />
                            </button>
                          )}
                          {onDelete && (
                            <button onClick={() => onDelete(row)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete">
                              <Trash2 size={15} />
                            </button>
                          )}
                          {actions && actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
            <div>
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={14} /> Prev
              </Button>
              <span className="px-2">Page {page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
