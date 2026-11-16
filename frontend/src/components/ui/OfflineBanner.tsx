import { strings } from '../../strings'
import { DownloadIcon } from './icons'

/** Black banner shown only while offline. Positioning is up to the screen. */
export function OfflineBanner({ pendingCount, className = '' }: { pendingCount: number; className?: string }) {
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-[14px] bg-text px-3.5 py-3 shadow-card ${className}`}
    >
      <DownloadIcon size={20} className="mt-px shrink-0 text-on-dark-accent" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold text-on-primary">{strings.offlineTitle}</span>
        {pendingCount > 0 && (
          <span className="text-sm leading-[1.35] font-medium text-on-dark-muted">
            {strings.offlinePending(pendingCount)}
          </span>
        )}
      </div>
    </div>
  )
}
