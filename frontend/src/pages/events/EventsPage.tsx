import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { api } from '../../lib/axios.js'
import { TopNav } from '../../components/layout/TopNav.js'
import { RootState } from '../../store/index.js'
import { IconSearch, IconFilter, IconX } from '../../components/icons.js'

interface Event {
  _id: string
  event: string
  distinctId: string
  time: string
  properties: Record<string, any>
}

type TimeRange = 'today' | 'yesterday' | '7d' | '30d' | '6m' | '1y' | 'all'

export function EventsPage() {
  const project = useSelector((s: RootState) => s.project.current)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['recent-events', project?._id],
    queryFn: async () => {
      const response = await api.get('/analytics/recent-events', { params: { projectId: project!._id, limit: 1000 } })
      return response.data
    },
    enabled: !!project,
    refetchInterval: 10000,
  })

  const { data: eventTypes } = useQuery<string[]>({
    queryKey: ['event-types', project?._id],
    queryFn: () => api.get('/analytics/events', { params: { projectId: project!._id } }).then((r) => r.data),
    enabled: !!project,
  })

  function getTimeRangeDate(range: TimeRange): Date | null {
    const now = new Date()
    switch (range) {
      case 'today':
        const today = new Date(); today.setHours(0, 0, 0, 0); return today
      case 'yesterday':
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0, 0, 0, 0); return yesterday
      case '7d': return new Date(now.getTime() - 7 * 86400000)
      case '30d': return new Date(now.getTime() - 30 * 86400000)
      case '6m': return new Date(now.getTime() - 180 * 86400000)
      case '1y': return new Date(now.getTime() - 365 * 86400000)
      case 'all': return null
    }
  }

  const filteredEvents = useMemo(() => {
    if (!events) return []
    let filtered = events
    const rangeDate = getTimeRangeDate(timeRange)
    if (rangeDate) filtered = filtered.filter((e) => new Date(e.time) >= rangeDate)
    if (selectedEventTypes.length > 0) filtered = filtered.filter((e) => selectedEventTypes.includes(e.event))
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((e) =>
        e.event.toLowerCase().includes(query) || e.distinctId.toLowerCase().includes(query) || JSON.stringify(e.properties).toLowerCase().includes(query)
      )
    }
    return filtered
  }, [events, timeRange, selectedEventTypes, searchQuery])

  function toggleEventType(eventType: string) {
    setSelectedEventTypes((prev) => prev.includes(eventType) ? prev.filter((e) => e !== eventType) : [...prev, eventType])
  }

  function formatTime(time: string) {
    const date = new Date(time)
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleString()
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <TopNav title="Events" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-tertiary text-[13px]">No project selected</p>
            <p className="text-text-quaternary text-[12px] mt-1">Please select a project to view events</p>
          </div>
        </div>
      </div>
    )
  }

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: 'all', label: 'All' },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopNav title="Events" />
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] text-text-quaternary font-medium tracking-wide uppercase">Events</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 bg-surface rounded-xl p-0.5 border border-border">
                  {timeRangeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTimeRange(option.value)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                        timeRange === option.value
                          ? 'bg-surface-3 text-text-primary'
                          : 'text-text-quaternary hover:text-text-secondary'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-quaternary" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-[12px] bg-surface border border-border rounded-xl text-text-primary placeholder-text-quaternary focus:outline-none focus:border-border-strong w-48"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-quaternary hover:text-text-secondary">
                      <IconX size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {eventTypes && eventTypes.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-[11px] text-text-quaternary">
                  <IconFilter size={11} />
                  <span>Filter:</span>
                </div>
                <button
                  onClick={() => setSelectedEventTypes([])}
                  className={`px-2 py-0.5 text-[11px] rounded-lg border transition-all ${
                    selectedEventTypes.length === 0
                      ? 'bg-accent-muted border-border-strong text-text-primary'
                      : 'border-border text-text-quaternary hover:text-text-secondary hover:border-border-strong'
                  }`}
                >
                  All Events
                </button>
                {eventTypes.slice(0, 10).map((eventType) => (
                  <button
                    key={eventType}
                    onClick={() => toggleEventType(eventType)}
                    className={`px-2 py-0.5 text-[11px] rounded-lg border transition-all ${
                      selectedEventTypes.includes(eventType)
                        ? 'bg-accent-muted border-border-strong text-text-primary'
                        : 'border-border text-text-quaternary hover:text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    {eventType}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 text-[11px] text-text-quaternary">
              Showing <span className="text-text-secondary">{filteredEvents.length}</span> of{' '}
              <span className="text-text-secondary">{events?.length || 0}</span> events
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-medium text-text-quaternary uppercase tracking-wider">Event</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium text-text-quaternary uppercase tracking-wider">Time</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium text-text-quaternary uppercase tracking-wider">Distinct ID</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium text-text-quaternary uppercase tracking-wider">City</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium text-text-quaternary uppercase tracking-wider">Country</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium text-text-quaternary uppercase tracking-wider">OS</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex gap-1.5 justify-center">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-quaternary animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                      <p className="text-[12px] text-text-quaternary mt-3">Loading events...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <p className="text-[13px] text-red-400">Error loading events</p>
                    </td>
                  </tr>
                ) : filteredEvents.length > 0 ? (
                  filteredEvents.map((evt) => (
                    <>
                      <tr
                        key={evt._id}
                        onClick={() => setExpandedRow(expandedRow === evt._id ? null : evt._id)}
                        className="hover:bg-accent-muted transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3">
                          <span className="text-[13px] font-medium text-text-primary">{evt.event}</span>
                        </td>
                        <td className="px-5 py-3 text-[12px] text-text-tertiary">{formatTime(evt.time)}</td>
                        <td className="px-5 py-3 text-[11px] font-mono text-text-tertiary truncate max-w-[150px]">{evt.distinctId}</td>
                        <td className="px-5 py-3 text-[12px] text-text-tertiary">{evt.properties?.city || '\u2014'}</td>
                        <td className="px-5 py-3 text-[12px] text-text-tertiary">{evt.properties?.country || '\u2014'}</td>
                        <td className="px-5 py-3 text-[12px] text-text-tertiary">{evt.properties?.os || evt.properties?.$os || '\u2014'}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-text-quaternary text-[11px]">
                            {expandedRow === evt._id ? '\u25BC' : '\u25B6'}
                          </span>
                        </td>
                      </tr>
                      {expandedRow === evt._id && (
                        <tr>
                          <td colSpan={7} className="px-5 py-4 bg-surface/50">
                            <div className="grid grid-cols-3 gap-4">
                              {Object.entries(evt.properties || {}).map(([key, value]) => (
                                <div key={key} className="flex flex-col gap-1">
                                  <span className="text-[10px] text-text-quaternary uppercase tracking-wider">{key}</span>
                                  <span className="text-[12px] text-text-secondary font-mono break-all">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <p className="text-[13px] text-text-tertiary">No events yet</p>
                      <p className="text-[12px] text-text-quaternary mt-1">Events will appear here as they are tracked</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
