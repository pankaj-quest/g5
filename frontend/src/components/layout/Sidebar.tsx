import { NavLink } from 'react-router-dom'
import {
  IconDashboard,
  IconTrendingUp,
  IconFilter,
  IconRetention,
  IconFlows,
  IconList,
  IconUsers,
  IconSettings,
} from '../icons.js'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
  { to: '/insights', label: 'Insights', Icon: IconTrendingUp },
  { to: '/funnels', label: 'Funnels', Icon: IconFilter },
  { to: '/retention', label: 'Retention', Icon: IconRetention },
  { to: '/flows', label: 'Flows', Icon: IconFlows },
  { to: '/events', label: 'Events', Icon: IconList },
  { to: '/people', label: 'Users', Icon: IconUsers },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
]

export function Sidebar() {
  return (
    <aside className="w-[240px] min-h-screen flex flex-col shrink-0 bg-surface border-r border-border">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center gap-3">
        <div className="w-[26px] h-[26px] rounded-md bg-btn-bg flex items-center justify-center shrink-0">
          <span className="text-btn-text font-semibold text-[13px] leading-none">G</span>
        </div>
        <span className="text-text-primary font-medium text-[14px] tracking-[-0.01em]">G5 Analytics</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-3">
        <div className="space-y-[2px]">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-all duration-150 ${
                  isActive
                    ? 'bg-accent-muted text-text-primary font-medium'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-accent-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={15}
                    className={isActive ? 'text-text-primary' : 'text-text-quaternary'}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center text-[10px] text-text-tertiary font-medium shrink-0">
            U
          </div>
          <span className="text-[12px] text-text-quaternary truncate">My Workspace</span>
        </div>
      </div>
    </aside>
  )
}
