interface Props {
  connected: boolean
  eventsPerInterval: number
}

export function RealtimePulse({ connected, eventsPerInterval }: Props) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-text-quaternary">
      <span className="relative flex h-1.5 w-1.5">
        {connected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-40" />
        )}
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
            connected ? 'bg-emerald-500' : 'bg-text-quaternary'
          }`}
        />
      </span>
      <span className={connected ? 'text-text-tertiary' : ''}>
        {connected ? `${eventsPerInterval} events/5s` : 'Offline'}
      </span>
    </div>
  )
}
