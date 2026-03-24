import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/index.js'
import { setTheme, Theme } from '../../store/theme.slice.js'
import { setProjects, switchProject } from '../../store/project.slice.js'
import { TopNav } from '../../components/layout/TopNav.js'
import { Select } from '../../components/ui/Select.js'
import { api } from '../../lib/axios.js'
import { IconPlus } from '../../components/icons.js'

export function SettingsPage() {
  const dispatch = useDispatch()
  const theme = useSelector((s: RootState) => s.theme.theme)
  const project = useSelector((s: RootState) => s.project.current)
  const projects = useSelector((s: RootState) => s.project.list)

  const [newProjectName, setNewProjectName] = useState('')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<{ token: string; secretKey: string } | null>(null)
  const [error, setError] = useState('')

  async function createProject() {
    if (!newProjectName.trim()) return
    setCreating(true)
    setError('')
    setCreated(null)
    try {
      const { data } = await api.post('/projects', { name: newProjectName })
      setCreated({ token: data.token, secretKey: data.secretKey })
      setNewProjectName('')
      // Refresh project list
      const res = await api.get('/projects')
      dispatch(setProjects(res.data))
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopNav title="Settings" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Create Project */}
        <div className="bg-surface-1 border border-border rounded-2xl p-6">
          <h2 className="text-[14px] font-medium text-text-primary mb-1">Create Project</h2>
          <p className="text-[12px] text-text-quaternary mb-5">Each project has its own token, events, and analytics</p>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name (e.g. My SaaS App)"
              className="flex-1 bg-surface border border-border-strong rounded-xl px-3.5 py-2.5 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:ring-1 focus:ring-accent-hover focus:border-border-strong transition-all"
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
            />
            <button
              onClick={createProject}
              disabled={!newProjectName.trim() || creating}
              className="bg-btn-bg hover:bg-btn-hover disabled:opacity-30 disabled:cursor-not-allowed text-btn-text px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2"
            >
              <IconPlus size={13} />
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>

          {error && (
            <div className="mt-3 px-3.5 py-2.5 bg-red-500/[0.06] border border-red-500/10 text-red-400 rounded-xl text-[13px]">
              {error}
            </div>
          )}

          {created && (
            <div className="mt-4 bg-surface rounded-xl border border-border p-4 space-y-3">
              <p className="text-[13px] text-text-secondary font-medium">Project created successfully</p>
              <div>
                <p className="text-[11px] text-text-quaternary uppercase tracking-wide mb-1">Project Token</p>
                <code className="block text-[12px] font-mono text-text-primary bg-surface-3 px-3 py-2 rounded-lg select-all">{created.token}</code>
              </div>
              <div>
                <p className="text-[11px] text-text-quaternary uppercase tracking-wide mb-1">Secret Key (shown once)</p>
                <code className="block text-[12px] font-mono text-text-primary bg-surface-3 px-3 py-2 rounded-lg select-all break-all">{created.secretKey}</code>
              </div>
              <p className="text-[11px] text-text-quaternary">Save the secret key now. You won't be able to see it again.</p>
            </div>
          )}
        </div>

        {/* Switch Project */}
        {projects.length > 1 && (
          <div className="bg-surface-1 border border-border rounded-2xl p-6">
            <h2 className="text-[14px] font-medium text-text-primary mb-1">Switch Project</h2>
            <p className="text-[12px] text-text-quaternary mb-5">You have {projects.length} projects</p>

            <div className="space-y-2">
              {projects.map((p: any) => (
                <button
                  key={p._id}
                  onClick={() => dispatch(switchProject(p))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                    project?._id === p._id
                      ? 'border-border-strong bg-accent-muted'
                      : 'border-border hover:bg-accent-muted hover:border-border-strong'
                  }`}
                >
                  <div>
                    <p className="text-[13px] text-text-primary font-medium">{p.name}</p>
                    <p className="text-[11px] text-text-quaternary font-mono mt-0.5">{p.token}</p>
                  </div>
                  {project?._id === p._id && (
                    <span className="text-[11px] text-text-tertiary bg-surface-3 px-2 py-0.5 rounded-lg">Current</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Project Info */}
        {project && (
          <div className="bg-surface-1 border border-border rounded-2xl p-6">
            <h2 className="text-[14px] font-medium text-text-primary mb-1">Current Project</h2>
            <p className="text-[12px] text-text-quaternary mb-5">Details for the selected project</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-[13px] text-text-secondary">Project Name</p>
                </div>
                <span className="text-[13px] text-text-primary font-mono bg-surface-3 px-3 py-1.5 rounded-lg">
                  {project.name}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-[13px] text-text-secondary">Project Token</p>
                  <p className="text-[12px] text-text-quaternary mt-0.5">Use this to initialize the SDK</p>
                </div>
                <code className="text-[12px] text-text-primary font-mono bg-surface-3 px-3 py-1.5 rounded-lg select-all">
                  {project.token}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Appearance */}
        <div className="bg-surface-1 border border-border rounded-2xl p-6">
          <h2 className="text-[14px] font-medium text-text-primary mb-1">Appearance</h2>
          <p className="text-[12px] text-text-quaternary mb-5">Customize how G5 looks</p>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-[13px] text-text-secondary">Theme</p>
              <p className="text-[12px] text-text-quaternary mt-0.5">Switch between dark and light mode</p>
            </div>
            <Select
              value={theme}
              onChange={(v) => dispatch(setTheme(v as Theme))}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
              ]}
              className="w-32"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
