import { useEffect, useRef } from 'react'
import { useCall } from '@/hooks/useCall'
import type { FeedItem } from '@/types/call'

/**
 * Visually-hidden ARIA live regions so a screen-reader operator can follow the
 * call without seeing it:
 *  - polite: each new final transcript line ("Caller: …" / "AI: …")
 *  - assertive: urgent state — a checkpoint opening, or an error notice.
 * Announcements are written straight to the live-region nodes (no React state),
 * so nothing is re-read on unrelated re-renders.
 */
export function LiveAnnouncer() {
  const call = useCall()
  const politeRef = useRef<HTMLDivElement>(null)
  const assertiveRef = useRef<HTMLDivElement>(null)

  // New final utterances → polite.
  const lastUtterId = useRef<string | null>(null)
  useEffect(() => {
    const utter = [...call.feed].reverse().find(
      (i): i is Extract<FeedItem, { kind: 'utterance' }> => i.kind === 'utterance' && i.final,
    )
    if (utter && utter.id !== lastUtterId.current) {
      lastUtterId.current = utter.id
      const who = utter.speaker === 'ai' ? 'AI' : 'Caller'
      if (politeRef.current) politeRef.current.textContent = `${who}: ${utter.words.map((w) => w.text).join(' ')}`
    }
  }, [call.feed])

  // A checkpoint opening → assertive.
  const lastPending = useRef<string | null>(null)
  useEffect(() => {
    const p = call.pending
    const key = p ? `${p.request.kind}:${p.request.title}` : null
    if (key !== lastPending.current) {
      lastPending.current = key
      if (p && assertiveRef.current) assertiveRef.current.textContent = `Action needed: ${p.hint ?? p.request.title}`
    }
  }, [call.pending])

  // Latest error notice (caller dropped, etc.) → assertive.
  const lastNoticeId = useRef<string | null>(null)
  useEffect(() => {
    const notice = [...call.feed].reverse().find(
      (i): i is Extract<FeedItem, { kind: 'notice' }> => i.kind === 'notice' && i.tone === 'error',
    )
    if (notice && notice.id !== lastNoticeId.current) {
      lastNoticeId.current = notice.id
      if (assertiveRef.current) assertiveRef.current.textContent = notice.text
    }
  }, [call.feed])

  return (
    <>
      <div ref={politeRef} className="sr-only" aria-live="polite" aria-atomic="true" />
      <div ref={assertiveRef} className="sr-only" role="alert" aria-live="assertive" aria-atomic="true" />
    </>
  )
}
