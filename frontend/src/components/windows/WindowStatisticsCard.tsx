import React from 'react'
import type { WindowStatistics } from '@/api/types'
import { StatCard } from '@/components/common/StatCard'
import { formatRate } from '@/utils/formatters'
import { Activity, ArrowRightLeft, Database, Zap } from 'lucide-react'

interface WindowStatisticsCardProps {
  statistics?: WindowStatistics | null
  loading?: boolean
  className?: string
}

export const WindowStatisticsCard: React.FC<WindowStatisticsCardProps> = ({
  statistics,
  loading = false,
  className,
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className || ''}`}>
      <StatCard
        title="Total Network Flows"
        value={
          loading || !statistics
            ? '—'
            : statistics.total_network_flows.toLocaleString('en-US')
        }
        subtitle="Flows mapped into window"
        icon={<Database className="w-4 h-4 text-cyan-400" />}
        loading={loading}
      />

      <StatCard
        title="Packets Per Second"
        value={
          loading || !statistics
            ? '—'
            : formatRate(statistics.packets_per_second, 'pkts/s')
        }
        subtitle="Throughput packet rate"
        icon={<Activity className="w-4 h-4 text-blue-400" />}
        loading={loading}
      />

      <StatCard
        title="Bytes Per Second"
        value={
          loading || !statistics
            ? '—'
            : formatRate(statistics.bytes_per_second, 'B/s')
        }
        subtitle="Throughput bandwidth"
        icon={<Zap className="w-4 h-4 text-amber-400" />}
        loading={loading}
      />

      <StatCard
        title="Active Connections"
        value={
          loading || !statistics
            ? '—'
            : statistics.active_connections.toLocaleString('en-US')
        }
        subtitle="Distinct 5-tuple conversations"
        icon={<ArrowRightLeft className="w-4 h-4 text-emerald-400" />}
        loading={loading}
      />
    </div>
  )
}
