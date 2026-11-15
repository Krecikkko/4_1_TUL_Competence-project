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
import type { Detection } from '@/api/types'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { ConfidenceIndicator } from '@/components/common/ConfidenceIndicator'
import { DataTablePagination } from '@/components/common/DataTablePagination'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDateTime } from '@/utils/formatters'
import {
  ArrowUpDown,
  Search,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'

interface DetectionTableProps {
  detections: Detection[]
  onClearFilters?: () => void
}

export const DetectionTable: React.FC<DetectionTableProps> = ({
  detections,
  onClearFilters,
}) => {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'id', desc: true },
  ])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<Detection>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            ID
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono text-cyan-400 font-semibold text-xs">
            #{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'detected_at_us',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Timestamp (UTC)
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
        accessorKey: 'type',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Anomaly Type
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </button>
        ),
        cell: (info) => (
          <span className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'severity',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Severity
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </button>
        ),
        cell: (info) => (
          <SeverityBadge severity={info.getValue() as string} />
        ),
      },
      {
        accessorKey: 'confidence',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Confidence
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </button>
        ),
        cell: (info) => (
          <ConfidenceIndicator confidence={info.getValue() as number} />
        ),
      },
      {
        accessorKey: 'source_ip',
        header: 'Source IP',
        cell: (info) => {
          const val = info.getValue() as string | null
          return (
            <span className="font-mono text-xs text-slate-300">
              {val || <span className="text-slate-500">—</span>}
            </span>
          )
        },
      },
      {
        accessorKey: 'destination_ip',
        header: 'Destination IP',
        cell: (info) => {
          const val = info.getValue() as string | null
          return (
            <span className="font-mono text-xs text-slate-300">
              {val || <span className="text-slate-500">—</span>}
            </span>
          )
        },
      },
      {
        accessorKey: 'method',
        header: 'Method / Rule',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-400">
            <strong className="text-slate-300">{row.original.method}</strong>
            <span className="text-slate-600 mx-1">/</span>
            {row.original.rule_id}
          </span>
        ),
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
    data: detections,
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
        pageSize: 10,
      },
    },
  })

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-md backdrop-blur-xs overflow-hidden">
      {/* Table controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search in results (IP, type, rule)..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-700/80 bg-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
          />
        </div>

        <div className="text-xs text-slate-400">
          Total in view: <strong className="text-white font-mono">{table.getFilteredRowModel().rows.length}</strong>
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
                  onClick={() => navigate(`/detections/${row.original.id}`)}
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
                    title="No detections match your criteria"
                    description="Try adjusting your filters or search keywords."
                    action={
                      onClearFilters
                        ? {
                            label: 'Reset Filters',
                            onClick: onClearFilters,
                          }
                        : undefined
                    }
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
