import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from '@tanstack/react-table'
import type { TimeWindow, WindowType } from '@/api/types'
import { DataTablePagination } from '@/components/common/DataTablePagination'
import { EmptyState } from '@/components/common/EmptyState'
import {
  formatDateTime,
  parseDjangoDuration,
  calculateEndTime,
} from '@/utils/formatters'
import { ArrowUpDown, Search, ChevronRight, Clock, Layers } from 'lucide-react'

interface TimeWindowTableProps {
  windows: TimeWindow[]
  className?: string
}

const windowTypeBadgeColors: Record<WindowType, string> = {
  GLOBAL: 'bg-blue-950/80 text-blue-400 border-blue-700/80',
  SOURCE: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/80',
  DESTIN: 'bg-purple-950/80 text-purple-400 border-purple-700/80',
  SO1DE1: 'bg-amber-950/80 text-amber-400 border-amber-700/80',
}

export const TimeWindowTable: React.FC<TimeWindowTableProps> = ({
  windows,
  className,
}) => {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'id', desc: true },
  ])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<TimeWindow>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Window ID
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono text-cyan-400 font-semibold text-xs">
            TW#{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Grouping Type',
        cell: (info) => {
          const type = (info.getValue() as string) as WindowType
          const badgeClass =
            windowTypeBadgeColors[type] ||
            'bg-slate-800 text-slate-300 border-slate-700'
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${badgeClass}`}
            >
              <Layers className="w-3 h-3" />
              {type}
            </span>
          )
        },
      },
      {
        accessorKey: 'start_timestamp_us',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Start Timestamp (UTC)
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono text-xs text-slate-300 whitespace-nowrap">
            {formatDateTime(info.getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: 'duration_us',
        header: 'Window Duration',
        cell: (info) => {
          const parsed = parseDjangoDuration(info.getValue() as string)
          return (
            <span
              className="font-mono text-xs text-amber-300 font-medium"
              title={`Raw: ${info.getValue() as string}`}
            >
              {parsed.formatted}
            </span>
          )
        },
      },
      {
        id: 'end_timestamp',
        header: 'Computed End (UTC)',
        cell: ({ row }) => {
          const res = calculateEndTime(
            row.original.start_timestamp_us,
            row.original.duration_us
          )
          return (
            <span className="font-mono text-xs text-slate-400 whitespace-nowrap">
              {res.isValid ? res.formatted : '—'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: () => (
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: windows,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  })

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/90 shadow-md backdrop-blur-xs overflow-hidden ${className || ''}`}>
      {/* Table controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search windows by ID, type..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-700/80 bg-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Total Windows:</span>
          <strong className="text-white font-mono">{table.getFilteredRowModel().rows.length}</strong>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider text-2xs"
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-3 px-4 font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-slate-800/50">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/windows/${row.original.id}`)}
                  className="group hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center">
                  <EmptyState
                    title="No time windows found"
                    description="No time windows have been recorded yet by the anomaly detection worker."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getRowModel().rows.length > 0 && (
        <DataTablePagination table={table} />
      )}
    </div>
  )
}
