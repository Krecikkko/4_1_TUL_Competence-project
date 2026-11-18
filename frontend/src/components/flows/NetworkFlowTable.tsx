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
import type { NetworkFlow } from '@/api/types'
import { TcpFlagBadges } from './TcpFlagBadges'
import { DataTablePagination } from '@/components/common/DataTablePagination'
import { EmptyState } from '@/components/common/EmptyState'
import {
  formatDateTime,
  parseDjangoDuration,
  formatBytes,
  formatPackets,
} from '@/utils/formatters'
import { ArrowUpDown, Search, ChevronRight, ArrowRight } from 'lucide-react'

interface NetworkFlowTableProps {
  flows: NetworkFlow[]
  className?: string
}

export const NetworkFlowTable: React.FC<NetworkFlowTableProps> = ({
  flows,
  className,
}) => {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'id', desc: true },
  ])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<NetworkFlow>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Flow ID
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono text-cyan-400 font-semibold text-xs">
            FL#{info.getValue() as number}
          </span>
        ),
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
        header: 'Duration',
        cell: (info) => {
          const parsed = parseDjangoDuration(info.getValue() as string)
          return (
            <span
              className="font-mono text-xs text-slate-300"
              title={`Raw: ${info.getValue() as string} (${parsed.totalMicroseconds} µs)`}
            >
              {parsed.formatted}
            </span>
          )
        },
      },
      {
        id: 'source',
        header: 'Source (IP:Port)',
        accessorFn: (row) =>
          row.source_port === null ? row.source_ip : `${row.source_ip}:${row.source_port}`,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-emerald-400 font-medium">
            {row.original.source_ip}
            {row.original.source_port !== null && (
              <>
                :<span className="text-emerald-300">{row.original.source_port}</span>
              </>
            )}
          </span>
        ),
      },
      {
        id: 'flow_direction',
        header: '',
        cell: () => <ArrowRight className="w-3.5 h-3.5 text-slate-600" />,
      },
      {
        id: 'destination',
        header: 'Destination (IP:Port)',
        accessorFn: (row) =>
          row.destination_port === null
            ? row.destination_ip
            : `${row.destination_ip}:${row.destination_port}`,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-indigo-400 font-medium">
            {row.original.destination_ip}
            {row.original.destination_port !== null && (
              <>
                :<span className="text-indigo-300">{row.original.destination_port}</span>
              </>
            )}
          </span>
        ),
      },
      {
        accessorKey: 'protocol',
        header: 'Proto',
        cell: (info) => (
          <span className="px-2 py-0.5 rounded-md text-2xs font-mono font-semibold bg-slate-800 text-slate-200 border border-slate-700">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'packet_count',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Packets
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono text-xs text-slate-300">
            {formatPackets(info.getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'byte_count',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Bytes
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono text-xs text-slate-300">
            {formatBytes(info.getValue() as number)}
          </span>
        ),
      },
      {
        id: 'tcp_flags',
        header: 'TCP Flags',
        cell: ({ row }) => <TcpFlagBadges flags={row.original.tcp_flags} compact />,
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
    data: flows,
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
            placeholder="Search flows by IP, port, protocol..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-700/80 bg-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
          />
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-white font-mono">{table.getFilteredRowModel().rows.length}</strong> flows
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
                  onClick={() => navigate(`/flows/${row.original.id}`)}
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
                    title="No network flows found"
                    description="No network flows match the search query or are currently recorded in the database."
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
