import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { api } from '../../lib/axios.js'
import { TopNav } from '../../components/layout/TopNav.js'
import { RootState } from '../../store/index.js'

interface Profile {
  _id: string
  distinctId: string
  firstSeen: string
  lastSeen: string
  totalEvents: number
  properties: Record<string, unknown>
  deviceIds?: string[]
}

export function PersonDetail() {
  const { profileId } = useParams()
  const project = useSelector((s: RootState) => s.project.current)
  const navigate = useNavigate()

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['person', profileId],
    queryFn: () =>
      api.get(`/analytics/people/${profileId}`, { params: { projectId: project!._id } }).then((r) => r.data),
    enabled: !!project && !!profileId,
  })

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopNav title="User Profile" />
      <div className="flex-1 overflow-auto p-6 space-y-5">
        <button
          onClick={() => navigate('/people')}
          className="text-[13px] text-text-tertiary hover:text-text-primary transition-colors"
        >
          &larr; Back to Users
        </button>

        {isLoading ? (
          <div className="bg-surface-1 border border-border rounded-2xl p-10 text-center">
            <div className="flex gap-1.5 justify-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-quaternary animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        ) : !profile ? (
          <div className="bg-surface-1 border border-border rounded-2xl p-10 text-center">
            <p className="text-[13px] text-text-tertiary">User not found</p>
          </div>
        ) : (
          <>
            {/* Identity */}
            <div className="bg-surface-1 border border-border rounded-2xl p-6">
              <h2 className="text-[14px] font-medium text-text-primary mb-4">Identity</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[13px] text-text-tertiary">Distinct ID</span>
                  <code className="text-[12px] font-mono text-text-primary bg-surface-3 px-2.5 py-1 rounded-lg select-all">{profile.distinctId}</code>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[13px] text-text-tertiary">First Seen</span>
                  <span className="text-[13px] text-text-secondary">{new Date(profile.firstSeen).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[13px] text-text-tertiary">Last Seen</span>
                  <span className="text-[13px] text-text-secondary">{new Date(profile.lastSeen).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[13px] text-text-tertiary">Total Events</span>
                  <span className="text-[13px] text-text-primary tabular-nums">{profile.totalEvents?.toLocaleString() || 0}</span>
                </div>
                {profile.deviceIds && profile.deviceIds.length > 0 && (
                  <div className="flex items-start justify-between py-2">
                    <span className="text-[13px] text-text-tertiary">Device IDs</span>
                    <div className="flex flex-col items-end gap-1">
                      {profile.deviceIds.map((id) => (
                        <code key={id} className="text-[11px] font-mono text-text-quaternary">{id}</code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Properties */}
            <div className="bg-surface-1 border border-border rounded-2xl p-6">
              <h2 className="text-[14px] font-medium text-text-primary mb-4">Properties</h2>
              {profile.properties && Object.keys(profile.properties).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(profile.properties).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-[13px] text-text-tertiary">{key}</span>
                      <span className="text-[13px] text-text-secondary font-mono max-w-xs truncate">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-text-quaternary text-center py-6">No properties set</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
