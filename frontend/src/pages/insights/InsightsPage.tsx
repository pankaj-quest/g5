import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { api } from '../../lib/axios.js'
import { LineChart } from '../../components/charts/LineChart.js'
import { TopNav } from '../../components/layout/TopNav.js'
import { RootState } from '../../store/index.js'
import { Select } from '../../components/ui/Select.js'

export function InsightsPage() {
  const project = useSelector((s: RootState) => s.project.current)
  const [eventName, setEventName] = useState('')
  const [metric, setMetric] = useState<'total' | 'unique'>('total')
  const [unit, setUnit] = useState('day')
  const [submitted, setSubmitted] = useState(false)

  const { data: availableEvents } = useQuery({
    queryKey: ['available-events', project?._id],
    queryFn: () =>
      api.get('/analytics/events', { params: { projectId: project!._id } }).then((r) => r.data),
    enabled: !!project,
  })

  const { data, isFetching } = useQuery({
    queryKey: ['insights', project?._id, eventName, metric, unit],
    queryFn: async () => {
      const response = await api.get('/analytics/insights', { params: { projectId: project!._id, eventName, metric, unit } })
      return response.data
    },
    enabled: submitted && !!project && !!eventName,
  })

  const eventOptions = (availableEvents || []).map((evt: string) => ({ value: evt, label: evt }))

  const labels = data?.map((d: { _id: { date: string } }) =>
    new Date(d._id.date).toLocaleDateString()
  ) || []
  const counts = data?.map((d: { count: number }) => d.count) || []

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopNav title="Insights" />
      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="bg-surface-1 border border-border rounded-2xl p-5">
          <p className="text-[12px] text-text-quaternary font-medium tracking-wide uppercase mb-4">Query Builder</p>
          <div className="flex gap-2.5 flex-wrap items-center">
            <Select
              value={eventName}
              onChange={(v) => { setEventName(v); setSubmitted(false) }}
              options={eventOptions}
              placeholder="Select an event..."
              className="w-64"
            />
            <Select
              value={metric}
              onChange={(v) => setMetric(v as 'total' | 'unique')}
              options={[
                { value: 'total', label: 'Total events' },
                { value: 'unique', label: 'Unique users' },
              ]}
            />
            <Select
              value={unit}
              onChange={setUnit}
              options={[
                { value: 'hour', label: 'Hourly' },
                { value: 'day', label: 'Daily' },
                { value: 'week', label: 'Weekly' },
                { value: 'month', label: 'Monthly' },
              ]}
            />
            <button
              onClick={() => setSubmitted(true)}
              disabled={!eventName.trim()}
              className="bg-btn-bg hover:bg-btn-hover disabled:opacity-30 disabled:cursor-not-allowed text-btn-text px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
            >
              Run query
            </button>
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-2xl p-5">
          {isFetching ? (
            <div className="h-56 flex items-center justify-center">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-quaternary animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          ) : data?.length > 0 ? (
            <LineChart labels={labels} datasets={[{ label: eventName || 'Events', data: counts }]} />
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <p className="text-[13px] text-text-tertiary">No data yet</p>
              <p className="text-[12px] text-text-quaternary mt-1">Enter an event name and run a query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
