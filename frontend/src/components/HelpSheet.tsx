import { strings } from '../strings'
import { Sheet } from './ui/Sheet'

/** Aide sheet: how sync works, in three steps, and the one thing not to do. */
export function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title={strings.helpTitle} onClose={onClose}>
      <section className="flex flex-col gap-1.5" aria-labelledby="help-how-title">
        <h3 id="help-how-title" className="m-0 text-[17px] font-extrabold">
          {strings.helpHowTitle}
        </h3>
        <ol className="m-0 flex list-none flex-col p-0">
          {strings.helpSteps.map((step, i) => (
            <li key={step.title} className="flex gap-3 border-b border-divider py-2.5 last:border-b-0">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-on-primary"
              >
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-bold">{step.title}</span>
                <span className="text-sm leading-[1.4] font-medium text-text-muted">{step.body}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="m-0 text-sm leading-[1.4] font-medium text-text-muted">{strings.helpConflictNote}</p>
      </section>
      <p className="m-0 text-sm leading-[1.4] font-medium">{strings.helpWarning}</p>
    </Sheet>
  )
}
