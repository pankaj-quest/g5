import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { RootState } from '../../store/index.js'
import { TopNav } from '../../components/layout/TopNav.js'
import { useSocket } from '../../hooks/useSocket.js'
import { IconActivity, IconTrendingUp, IconUsers, IconList } from '../../components/icons.js'
import { api } from '../../lib/axios.js'

function EmptyLiveStream() {
  return (
    <div className="px-5 py-14 text-center">
      <div className="w-10 h-10 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-4">
        <IconActivity size={16} className="text-text-quaternary" />
      </div>
      <p className="text-[14px] text-text-secondary font-medium">No live events yet</p>
      <p className="text-[12px] text-text-quaternary mt-1.5 max-w-sm mx-auto leading-relaxed">
        Integrate the G5 SDK into your app and start tracking events. They will stream here in real time.
      </p>
      <div className="mt-5 bg-surface rounded-xl border border-border p-4 max-w-md mx-auto text-left">
        <p className="text-[11px] text-text-quaternary font-medium uppercase tracking-wide mb-2">Quick Start</p>
        <pre className="text-[12px] font-mono text-text-tertiary leading-relaxed overflow-x-auto">
{`import G5 from '@g5/sdk'

G5.init('<your-project-token>')
G5.track('Page View', {
  page: '/home'
})`}
        </pre>
      </div>
    </div>
  )
}

function NoProjectState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-5">
          <IconList size={20} className="text-text-quaternary" />
        </div>
        <h2 className="text-[18px] font-medium text-text-primary tracking-[-0.01em]">No project selected</h2>
        <p className="text-[13px] text-text-tertiary mt-2 leading-relaxed">
          Create a project to start collecting analytics data. Go to Settings to create one.
        </p>
      </div>
    </div>
  )
}

export function DashboardHome() {
  const project = useSelector((s: RootState) => s.project.current)
  const liveEvents = useSelector((s: RootState) => s.realtime.liveEvents)
  const eventsPerInterval = useSelector((s: RootState) => s.realtime.eventsPerInterval)

  useSocket(project?._id || '')

  const { data: stats } = useQuery({
    queryKey: ['project-stats', project?._id],
    queryFn: () =>
      api.get('/analytics/stats', { params: { projectId: project!._id } }).then((r) => r.data),
    enabled: !!project,
    refetchInterval: 30000,
  })

  if (!project) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <TopNav title="Dashboard" />
        <NoProjectState />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Events', value: stats?.totalEvents, icon: IconActivity, empty: 'No events tracked yet' },
    { label: 'Total Users', value: stats?.totalUsers, icon: IconUsers, empty: 'No users identified' },
    { label: 'Events Today', value: stats?.eventsToday, icon: IconTrendingUp, empty: 'No events today' },
    { label: 'Live (5s)', value: eventsPerInterval, icon: IconActivity, empty: 'Waiting for data' },
  ]

  const hasAnyData = stats && (stats.totalEvents > 0 || stats.totalUsers > 0)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopNav title="Dashboard" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon
            const val = card.value
            const hasValue = val != null && val > 0
            return (
              <div key={card.label} className="bg-surface-1 border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] text-text-quaternary font-medium tracking-wide uppercase">{card.label}</p>
                  <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center">
                    <Icon size={13} className="text-text-quaternary" />
                  </div>
                </div>
                {hasValue ? (
                  <p className="text-[28px] font-light text-text-primary tabular-nums tracking-[-0.02em]">
                    {Number(val).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-[14px] text-text-quaternary mt-1">{card.empty}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Getting started (show when no data) */}
        {!hasAnyData && (
          <div className="bg-surface-1 border border-border rounded-2xl p-6">
            <h2 className="text-[14px] font-medium text-text-primary mb-1">Get started with G5</h2>
            <p className="text-[12px] text-text-quaternary mb-5">Follow these steps to start collecting analytics</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface rounded-xl border border-border p-4">
                <div className="w-6 h-6 rounded-lg bg-surface-3 flex items-center justify-center text-[11px] font-medium text-text-quaternary mb-3">1</div>
                <p className="text-[13px] text-text-secondary font-medium">Install the SDK</p>
                <p className="text-[12px] text-text-quaternary mt-1">Add the G5 SDK to your web or mobile app</p>
                <code className="block mt-3 text-[11px] font-mono text-text-tertiary bg-surface-3 px-2.5 py-1.5 rounded-lg">npm install @g5/sdk</code>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <div className="w-6 h-6 rounded-lg bg-surface-3 flex items-center justify-center text-[11px] font-medium text-text-quaternary mb-3">2</div>
                <p className="text-[13px] text-text-secondary font-medium">Initialize & track</p>
                <p className="text-[12px] text-text-quaternary mt-1">Call G5.init() with your project token and start tracking events</p>
                <code className="block mt-3 text-[11px] font-mono text-text-tertiary bg-surface-3 px-2.5 py-1.5 rounded-lg">G5.track('Sign Up')</code>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <div className="w-6 h-6 rounded-lg bg-surface-3 flex items-center justify-center text-[11px] font-medium text-text-quaternary mb-3">3</div>
                <p className="text-[13px] text-text-secondary font-medium">Analyze</p>
                <p className="text-[12px] text-text-quaternary mt-1">Use Insights, Funnels, and Retention to understand your users</p>
                <code className="block mt-3 text-[11px] font-mono text-text-tertiary bg-surface-3 px-2.5 py-1.5 rounded-lg">Dashboard &rarr; Insights</code>
              </div>
            </div>
          </div>
        )}

        {/* Live stream */}
        <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <IconActivity size={14} className="text-text-quaternary" />
              <h2 className="text-[13px] font-medium text-text-secondary">Live Event Stream</h2>
            </div>
            <span className="text-[11px] text-text-quaternary bg-surface-3 px-2.5 py-1 rounded-lg">
              {liveEvents.length} events
            </span>
          </div>

          <div className="divide-y divide-border max-h-[460px] overflow-y-auto">
            {liveEvents.length === 0 ? (
              <EmptyLiveStream />
            ) : (
              liveEvents.map((e, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-5 hover:bg-accent-muted transition-colors">
                  <span className="text-[11px] text-text-quaternary shrink-0 font-mono w-20">
                    {new Date(e.time).toLocaleTimeString()}
                  </span>
                  <span className="text-[13px] font-medium text-text-primary shrink-0">{e.event}</span>
                  <span className="text-[11px] text-text-quaternary font-mono truncate">{e.distinctId}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
