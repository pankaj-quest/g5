import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { api } from '../../lib/axios.js'
import { TopNav } from '../../components/layout/TopNav.js'
import { IconArrowRight } from '../../components/icons.js'
import { RootState } from '../../store/index.js'
import { Select } from '../../components/ui/Select.js'

interface FlowPath {
  _id: string[]
  count: number
}

export function FlowsPage() {
  const project = useSelector((s: RootState) => s.project.current)
  const [startEvent, setStartEvent] = useState('__all__')
  const [maxDepth, setMaxDepth] = useState('4')
  const [enabled, setEnabled] = useState(false)

  const { data: availableEvents } = useQuery({
    queryKey: ['available-events', project?._id],
    queryFn: () =>
      api.get('/analytics/events', { params: { projectId: project!._id } }).then((r) => r.data),
    enabled: !!project,
  })

  const { data, isFetching } = useQuery<FlowPath[]>({
    queryKey: ['flows', project?._id, startEvent, maxDepth],
    queryFn: () =>
      api.get('/analytics/flows', { params: { projectId: project!._id, startEvent: startEvent === '__all__' ? undefined : startEvent, maxDepth: Number(maxDepth) } }).then((r) => r.data),
    enabled: enabled && !!project,
  })

  const eventOptions = [
    { value: '__all__', label: 'All events (no filter)' },
    ...(availableEvents || []).map((evt: string) => ({ value: evt, label: evt })),
  ]

  const maxCount = data?.[0]?.count || 1

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopNav title="Flows" />
      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="bg-surface-1 border border-border rounded-2xl p-5">
          <p className="text-[12px] text-text-quaternary font-medium tracking-wide uppercase mb-4">Flow Analysis</p>
          <div className="flex gap-2.5 items-center flex-wrap">
            <Select
              value={startEvent}
              onChange={setStartEvent}
              options={eventOptions}
              placeholder="Start event (optional)"
              className="w-52"
            />
            <Select
              value={maxDepth}
              onChange={setMaxDepth}
              options={[
                { value: '3', label: '3 steps' },
                { value: '4', label: '4 steps' },
                { value: '5', label: '5 steps' },
                { value: '6', label: '6 steps' },
              ]}
            />
            <button
              onClick={() => setEnabled(true)}
              className="bg-btn-bg hover:bg-btn-hover text-btn-text px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
            >
              Analyze
            </button>
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-2xl p-5">
          {isFetching ? (
            <div className="h-48 flex items-center justify-center">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-quaternary animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          ) : data && data.length > 0 ? (
            <div className="space-y-1.5">
              {data.slice(0, 20).map((path, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-accent-muted transition-colors">
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    {path._id.map((step, j) => (
                      <span key={j} className="flex items-center gap-1.5">
                        <span className="bg-surface-3 text-text-secondary text-[12px] px-2.5 py-1 rounded-lg">
                          {step}
                        </span>
                        {j < path._id.length - 1 && (
                          <IconArrowRight size={11} className="text-text-quaternary shrink-0" />
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="w-36 flex items-center gap-2 shrink-0">
                    <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-hover rounded-full"
                        style={{ width: `${(path.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-text-quaternary tabular-nums w-8 text-right">{path.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <p className="text-[13px] text-text-tertiary">No flow data yet</p>
              <p className="text-[12px] text-text-quaternary mt-1">Click Analyze to see user paths</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
