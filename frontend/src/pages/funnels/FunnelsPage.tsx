import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { api } from '../../lib/axios.js'
import { RootState } from '../../store/index.js'
import { FunnelChart } from '../../components/charts/FunnelChart.js'
import { TopNav } from '../../components/layout/TopNav.js'
import { IconPlus, IconX } from '../../components/icons.js'
import { Select } from '../../components/ui/Select.js'

export function FunnelsPage() {
  const [steps, setSteps] = useState(['', ''])
  const [conversionWindow, setConversionWindow] = useState('86400')

  const project = useSelector((s: RootState) => s.project.current)

  const { data: availableEvents } = useQuery({
    queryKey: ['available-events', project?._id],
    queryFn: () =>
      api.get('/analytics/events', { params: { projectId: project!._id } }).then((r) => r.data),
    enabled: !!project,
  })

  const mutation = useMutation({
    mutationFn: (payload: { steps: string[]; conversionWindowSeconds: number }) =>
      api.post('/analytics/funnels', { ...payload, projectId: project?._id }).then((r) => r.data),
  })

  const eventOptions = (availableEvents || []).map((evt: string) => ({ value: evt, label: evt }))

  function addStep() { setSteps((s) => [...s, '']) }
  function updateStep(i: number, value: string) { setSteps((s) => s.map((v, idx) => (idx === i ? value : v))) }
  function removeStep(i: number) { setSteps((s) => s.filter((_, idx) => idx !== i)) }

  function runFunnel() {
    const validSteps = steps.filter((s) => s.trim())
    if (validSteps.length < 2) return
    mutation.mutate({ steps: validSteps, conversionWindowSeconds: Number(conversionWindow) })
  }

  const funnelSteps = steps.filter((s) => s.trim()).map((name, i) => ({
    name,
    count: mutation.data ? (mutation.data[`step${i + 1}`] as number) || 0 : 0,
  }))

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopNav title="Funnels" />
      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="bg-surface-1 border border-border rounded-2xl p-5">
          <p className="text-[12px] text-text-quaternary font-medium tracking-wide uppercase mb-4">Define Funnel</p>
          <div className="space-y-2.5 mb-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-md bg-surface-3 flex items-center justify-center text-[10px] text-text-quaternary font-medium shrink-0">
                  {i + 1}
                </div>
                <Select
                  value={step}
                  onChange={(v) => updateStep(i, v)}
                  options={eventOptions}
                  placeholder={`Select step ${i + 1} event...`}
                  className="w-64"
                />
                {steps.length > 2 && (
                  <button onClick={() => removeStep(i)} className="text-text-quaternary hover:text-red-400 transition-colors p-1">
                    <IconX size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={addStep} className="flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-text-primary transition-colors">
              <IconPlus size={13} />
              Add step
            </button>
            <div className="w-px h-3.5 bg-border-strong" />
            <Select
              value={conversionWindow}
              onChange={setConversionWindow}
              options={[
                { value: '3600', label: '1 hour window' },
                { value: '86400', label: '1 day window' },
                { value: '604800', label: '7 day window' },
                { value: '2592000', label: '30 day window' },
              ]}
            />
            <button
              onClick={runFunnel}
              disabled={steps.filter((s) => s.trim()).length < 2}
              className="bg-btn-bg hover:bg-btn-hover disabled:opacity-30 disabled:cursor-not-allowed text-btn-text px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
            >
              Calculate
            </button>
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-2xl p-5">
          {mutation.isPending ? (
            <div className="h-48 flex items-center justify-center">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-quaternary animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          ) : mutation.data ? (
            <FunnelChart steps={funnelSteps} />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <p className="text-[13px] text-text-tertiary">Define your funnel steps above</p>
              <p className="text-[12px] text-text-quaternary mt-1">Minimum 2 steps required</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
