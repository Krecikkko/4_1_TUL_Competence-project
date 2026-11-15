import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  ShieldAlert,
  LayoutDashboard,
  Network,
  Clock,
  History,
  ShieldCheck,
  Radio,
  X,
} from 'lucide-react'
import { ConnectionStatus } from '@/components/common/ConnectionStatus'
import { cn } from '@/utils/cn'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
  {
    to: '/',
    label: 'Overview',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/detections',
    label: 'Detections',
    icon: ShieldAlert,
  },
  {
    to: '/flows',
    label: 'Traffic Explorer',
    icon: Network,
  },
  {
    to: '/windows',
    label: 'Time Windows',
    icon: Clock,
  },
  {
    to: '/history',
    label: 'Detection History',
    icon: History,
  },
]

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white">
                  NetGuard
                </span>
                <span className="rounded-sm bg-blue-900/60 px-1 py-0.2 text-3xs font-mono font-semibold uppercase text-blue-300 border border-blue-700/50">
                  SOC
                </span>
              </div>
              <p className="text-2xs text-slate-400">Anomaly Detection</p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
          <div className="px-3 pb-2 text-3xs font-semibold uppercase tracking-wider text-slate-500">
            Monitoring & Analysis
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-xs'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive
                          ? 'text-blue-400'
                          : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer info & status */}
        <div className="border-t border-slate-800/80 p-4 space-y-3 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-slate-500" />
              API Service
            </span>
            <ConnectionStatus compact />
          </div>

          <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800/60 text-2xs text-slate-400 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Backend:</span>
              <span className="text-slate-300">Django 6.1</span>
            </div>
            <div className="flex justify-between">
              <span>Version:</span>
              <span className="text-slate-300">v1.0-soc</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
