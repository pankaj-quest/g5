interface Step {
  name: string
  count: number
}

interface Props {
  steps: Step[]
}

export function FunnelChart({ steps }: Props) {
  if (!steps.length) return null

  const max = steps[0].count || 1

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const pct = Math.round((step.count / max) * 100)
        const dropoff =
          i > 0 ? Math.round(((steps[i - 1].count - step.count) / steps[i - 1].count) * 100) : 0

        return (
          <div key={i} className="flex items-center gap-4">
            <div className="w-5 h-5 rounded-md bg-surface-3 flex items-center justify-center text-[10px] text-text-quaternary font-medium shrink-0">
              {i + 1}
            </div>
            <div className="w-28 text-right text-[13px] text-text-tertiary shrink-0 truncate">{step.name}</div>
            <div className="flex-1 relative h-9 bg-surface-3 rounded-xl overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-accent-hover rounded-xl transition-all duration-700 flex items-center"
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
              <span className="absolute inset-y-0 left-3 flex items-center text-[13px] font-medium text-text-primary z-10">
                {step.count.toLocaleString()}
              </span>
            </div>
            <div className="w-16 text-[13px] shrink-0 text-right">
              {i === 0 ? (
                <span className="text-text-tertiary">100%</span>
              ) : (
                <span className="text-red-400/80">{'\u2212'}{dropoff}%</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
