/* Small shared presentational bits used across console pieces. */

/** A low-confidence word inside a bubble — amber, underlined. */
export function FlaggedWordMobile({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[3px] border-b-2 border-warning-solid bg-[oklch(0.93_0.06_82)] px-1 font-semibold text-warning">
      {children}
    </span>
  )
}
