import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/index.js'
import { logout } from '../../store/auth.slice.js'
import { toggleTheme } from '../../store/theme.slice.js'
import { useNavigate } from 'react-router-dom'
import { RealtimePulse } from '../shared/RealtimePulse.js'
import { IconLogOut, IconSun, IconMoon } from '../icons.js'

export function TopNav({ title }: { title: string }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { connected, eventsPerInterval } = useSelector((s: RootState) => s.realtime)
  const theme = useSelector((s: RootState) => s.theme.theme)

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0">
      <h1 className="text-[14px] font-medium text-text-primary tracking-[-0.01em]">{title}</h1>
      <div className="flex items-center gap-4">
        <RealtimePulse connected={connected} eventsPerInterval={eventsPerInterval} />
        <div className="w-px h-3.5 bg-border-strong" />
        <button
          onClick={() => dispatch(toggleTheme())}
          className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-accent-muted transition-all"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
        </button>
        <div className="w-px h-3.5 bg-border-strong" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[12px] text-text-quaternary hover:text-text-secondary transition-colors"
        >
          <IconLogOut size={13} />
          Sign out
        </button>
      </div>
    </header>
  )
}
