import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { api } from '../../lib/axios.js'
import { RetentionGrid } from '../../components/charts/RetentionGrid.js'
import { TopNav } from '../../components/layout/TopNav.js'
import { RootState } from '../../store/index.js'
import { Select } from '../../components/ui/Select.js'

export function RetentionPage() {
  const project = useSelector((s: RootState) => s.project.current)
  const [birthEvent, setBirthEvent] = useState('')
  const [returnEvent, setReturnEvent] = useState('')
  const [unit, setUnit] = useState('week')
  const [enabled, setEnabled] = useState(false)

  const { data: availableEvents } = useQuery({
    queryKey: ['available-events', project?._id],
    queryFn: () =>
      api.get('/analytics/events', { params: { projectId: project!._id } }).then((r) => r.data),
    enabled: !!project,
  })

  const { data, isFetching } = useQuery({
    queryKey: ['retention', project?._id, birthEvent, returnEvent, unit],
    queryFn: () =>
      api.get('/analytics/retention', { params: { projectId: project!._id, birthEvent, returnEvent, unit } }).then((r) => r.data),
    enabled: enabled && !!birthEvent && !!returnEvent && !!project,
  })

  const eventOptions = (availableEvents || []).map((evt: string) => ({ value: evt, label: evt }))

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopNav title="Retention" />
      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="bg-surface-1 border border-border rounded-2xl p-5">
          <p className="text-[12px] text-text-quaternary font-medium tracking-wide uppercase mb-4">Retention Query</p>
          <div className="flex gap-2.5 flex-wrap items-center">
            <Select
              value={birthEvent}
              onChange={setBirthEvent}
              options={eventOptions}
              placeholder="Birth event (e.g. Sign Up)"
              className="w-52"
            />
            <Select
              value={returnEvent}
              onChange={setReturnEvent}
              options={eventOptions}
              placeholder="Return event (e.g. Login)"
              className="w-52"
            />
            <Select
              value={unit}
              onChange={setUnit}
              options={[
                { value: 'day', label: 'Daily' },
                { value: 'week', label: 'Weekly' },
                { value: 'month', label: 'Monthly' },
              ]}
            />
            <button
              onClick={() => setEnabled(true)}
              disabled={!birthEvent.trim() || !returnEvent.trim()}
              className="bg-btn-bg hover:bg-btn-hover disabled:opacity-30 disabled:cursor-not-allowed text-btn-text px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
            >
              Calculate
            </button>
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-2xl p-5">
          <p className="text-[12px] text-text-quaternary font-medium tracking-wide uppercase mb-4">Cohort Table</p>
          {isFetching ? (
            <div className="h-48 flex items-center justify-center">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-quaternary animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          ) : data?.length > 0 ? (
            <RetentionGrid data={data} />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <p className="text-[13px] text-text-tertiary">No retention data yet</p>
              <p className="text-[12px] text-text-quaternary mt-1">Set birth and return events above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
