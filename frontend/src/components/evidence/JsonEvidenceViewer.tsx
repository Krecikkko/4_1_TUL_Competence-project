import React, { useState } from 'react'
import { Check, Copy, Code, List } from 'lucide-react'
import { cn } from '@/utils/cn'

interface JsonEvidenceViewerProps {
  data: unknown
  title?: string
  className?: string
}

export const JsonEvidenceViewer: React.FC<JsonEvidenceViewerProps> = ({
  data,
  title = 'Key Feature Values',
  className,
}) => {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table')

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const isObject = typeof data === 'object' && data !== null && !Array.isArray(data)
  const hasEntries = isObject && Object.keys(data as Record<string, unknown>).length > 0

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {title}
          </span>
          {isObject && (
            <span className="text-xs font-mono text-slate-500">
              ({Object.keys(data as Record<string, unknown>).length} keys)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isObject && hasEntries && (
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('json')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
                  viewMode === 'json'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title="Raw JSON View"
              >
                <Code className="w-3.5 h-3.5" />
                JSON
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Copy JSON to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        {data === null || data === undefined ? (
          <p className="text-xs text-slate-500 italic">No evidence data provided</p>
        ) : viewMode === 'table' && isObject && hasEntries ? (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                <th className="pb-2 font-medium w-1/3">Feature Key</th>
                <th className="pb-2 font-medium">Value</th>
                <th className="pb-2 font-medium w-24">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {Object.entries(data as Record<string, unknown>).map(([key, val]) => {
                const valType = typeof val
                return (
                  <tr key={key} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 pr-4 text-cyan-400 font-semibold">{key}</td>
                    <td className="py-2.5 pr-4 text-slate-200">
                      {valType === 'object' && val !== null ? (
                        <pre className="bg-slate-950 p-2 rounded-md border border-slate-800 text-xs overflow-x-auto">
                          {JSON.stringify(val, null, 2)}
                        </pre>
                      ) : (
                        <span
                          className={cn(
                            valType === 'number' && 'text-amber-300',
                            valType === 'boolean' && 'text-emerald-400',
                            valType === 'string' && 'text-emerald-300',
                            val === null && 'text-slate-500 italic'
                          )}
                        >
                          {String(val)}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-500 text-2xs uppercase">
                      {val === null ? 'null' : valType}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <pre className="text-xs font-mono text-emerald-400/90 leading-relaxed overflow-x-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
