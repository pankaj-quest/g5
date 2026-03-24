import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/axios.js'
import { TopNav } from '../../components/layout/TopNav.js'
import { IconSearch } from '../../components/icons.js'
import { RootState } from '../../store/index.js'

interface Profile {
  _id: string
  distinctId: string
  firstSeen: string
  lastSeen: string
  totalEvents: number
  properties: Record<string, unknown>
}

export function PeopleList() {
  const project = useSelector((s: RootState) => s.project.current)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, isFetching } = useQuery<Profile[]>({
    queryKey: ['people', project?._id, search],
    queryFn: () =>
      api.get('/analytics/people', { params: { projectId: project!._id, search, limit: 50 } }).then((r) => r.data),
    enabled: !!project,
  })

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopNav title="Users" />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="bg-surface-1 border border-border rounded-2xl p-4">
          <div className="relative">
            <IconSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-quaternary" />
            <input
              placeholder="Search by user ID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-border-strong rounded-xl pl-10 pr-3.5 py-2.5 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:ring-1 focus:ring-accent-hover focus:border-border-strong transition-all"
            />
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-[11px] font-medium text-text-quaternary uppercase tracking-wider">User ID</th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-text-quaternary uppercase tracking-wider">First Seen</th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-text-quaternary uppercase tracking-wider">Last Seen</th>
                <th className="px-5 py-3 text-right text-[11px] font-medium text-text-quaternary uppercase tracking-wider">Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isFetching ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-[13px] text-text-tertiary">
                    Loading...
                  </td>
                </tr>
              ) : !data?.length ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-[13px] text-text-tertiary">
                    No users found
                  </td>
                </tr>
              ) : (
                data.map((profile) => (
                  <tr
                    key={profile._id}
                    onClick={() => navigate(`/people/${profile._id}`)}
                    className="hover:bg-accent-muted cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-[12px] text-text-tertiary max-w-xs truncate">
                      {profile.distinctId}
                    </td>
                    <td className="px-5 py-3 text-text-tertiary">
                      {new Date(profile.firstSeen).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-text-tertiary">
                      {new Date(profile.lastSeen).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-text-primary text-right tabular-nums">
                      {profile.totalEvents.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
