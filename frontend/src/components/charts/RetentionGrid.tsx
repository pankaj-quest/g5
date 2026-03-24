import { useSelector } from 'react-redux'
import { RootState } from '../../store/index.js'

interface Cell {
  cohortPeriod: string
  periodOffset: number
  retainedCount: number
  cohortSize: number
}

interface Props {
  data: Cell[]
}

function pctStyle(pct: number, isDark: boolean): string {
  if (isDark) {
    if (pct >= 80) return 'bg-[rgba(255,255,255,0.20)] text-text-primary'
    if (pct >= 60) return 'bg-[rgba(255,255,255,0.12)] text-text-primary'
    if (pct >= 40) return 'bg-[rgba(255,255,255,0.07)] text-text-secondary'
    if (pct >= 20) return 'bg-[rgba(255,255,255,0.04)] text-text-tertiary'
    return 'bg-transparent text-text-quaternary'
  } else {
    if (pct >= 80) return 'bg-[rgba(0,0,0,0.16)] text-text-primary'
    if (pct >= 60) return 'bg-[rgba(0,0,0,0.10)] text-text-primary'
    if (pct >= 40) return 'bg-[rgba(0,0,0,0.06)] text-text-secondary'
    if (pct >= 20) return 'bg-[rgba(0,0,0,0.03)] text-text-tertiary'
    return 'bg-transparent text-text-quaternary'
  }
}

export function RetentionGrid({ data }: Props) {
  const theme = useSelector((s: RootState) => s.theme.theme)
  const isDark = theme === 'dark'

  const cohorts = [...new Set(data.map((d) => d.cohortPeriod))].sort()
  const maxOffset = Math.max(...data.map((d) => d.periodOffset), 0)
  const offsets = Array.from({ length: maxOffset + 1 }, (_, i) => i)

  const map = new Map<string, Cell>()
  for (const cell of data) {
    map.set(`${cell.cohortPeriod}:${cell.periodOffset}`, cell)
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-[12px] border-collapse w-full">
        <thead>
          <tr>
            <th className="px-3 py-2.5 bg-surface-3 text-left text-text-tertiary font-medium border border-border rounded-tl-lg">
              Cohort
            </th>
            <th className="px-3 py-2.5 bg-surface-3 text-text-tertiary font-medium border border-border text-center">
              Size
            </th>
            {offsets.map((o) => (
              <th key={o} className="px-3 py-2.5 bg-surface-3 text-text-tertiary font-medium border border-border text-center whitespace-nowrap">
                {o === 0 ? 'Period 0' : `+${o}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => {
            const sizeCell = map.get(`${cohort}:0`)
            const size = sizeCell?.cohortSize || sizeCell?.retainedCount || 0
            return (
              <tr key={cohort}>
                <td className="px-3 py-2 border border-border font-medium text-text-secondary whitespace-nowrap">
                  {new Date(cohort).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 border border-border text-center text-text-tertiary tabular-nums">
                  {size}
                </td>
                {offsets.map((offset) => {
                  const cell = map.get(`${cohort}:${offset}`)
                  const pct = size > 0 && cell ? Math.round((cell.retainedCount / size) * 100) : 0
                  return (
                    <td
                      key={offset}
                      className={`px-3 py-2 border border-border text-center transition-colors tabular-nums ${pctStyle(pct, isDark)}`}
                      title={`${cell?.retainedCount || 0} users (${pct}%)`}
                    >
                      {cell ? `${pct}%` : '\u2014'}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
