## Prompts that materially helped.

The view layer/ Design was thought by me and given to claude code, how the UI should look like, there was no involvement of AI in it. 
I discussed architecture with claude code extensively, about folder structure, communication protocol to be mocked, data models and the view layer. Proof read everything, added comments
on the architecture.md file and told ai to address them, till i am satisfied and then implementation happened. In the initial go the architecture had some issues. Below are the edits i gave - 

## Architectural decisions I edited. 

All the below things were my feedback to the architecture proposed by claude code. - 


**Folder structure**
- Split `store/`, `hooks/`, `mock/`, and `types/` into separate top-level folders instead
  of a catch-all `lib/` (which is now reserved for pure utilities).
- Caught that a hook must be pure `.ts`: `useCall` was `.tsx` only because it also held the
  JSX provider. I had it split into `store/callContext.ts` (context, no JSX),
  `store/CallProvider.tsx` (provider), and `hooks/useCall.ts` (the hooks).

**Data model**
- `detect_drop` is an external **event/turn trigger**, not an agent step — removed it from
  `StepType`. A drop starts a system turn; only the reactions (`hold_booking`, `notify`,
  `schedule_callback`) are steps.
- Rejected a generic `recover` step as too broad — recovery is error-specific, so it's
  either a re-run of an existing step or a specific action; the four archetypes are a UI
  vocabulary, not a step type.
- Branching is **per-step outcome** (`success | warning | error | waiting`), not just at
  intent classification — server errors, payment errors, and lookup errors each take
  different paths. This is why the failure taxonomy is uniform.
- Each turn runs a **variable chain of steps** (canonical spine + conditional middle), and
  **every interaction produces a step group** — even a greeting.
- **One merged conversation feed** (not a split), with each turn's steps rendered **before**
  the AI's reply.

**Communication protocol**
- Raised transport early, which set the two-plane design: a **media plane** (WebRTC /
  telephony) vs an **event plane** (one bidirectional WebSocket; STT as streaming
  partials).
- Insisted on a typed `ServerEvent` / `ClientCommand` contract behind a `CallTransport`
  interface so the scripted mock is swappable for a real socket with **no store/view
  changes**, and made it command-driven (operator intents flow upstream) rather than a
  one-way feed.


Other than this prompt which really help were - 
1. Start a new session and give prompt - You are an senior frontend engineer who is experinced in making component accessibility, your job to create an analysis report on accessability of this project. Similarly, did for architecture critique as well.
2. I made an inital version of PRD myself according to the assigment and then gave claude code that PRD and assignment to see if i am missing anyting. - Prompt given was - You are a product manager with 10 years of experience, See if the PRD aligns and covers all aspects of the assignment given. 
3. After i finalised design i told claude to - Lets create domain componenets one by one in a separate page.  - This gave an initial layer of components to build on. 

**Another issue i found while looking at the code and prompted** - 
"We should not build the frontend around a convenience — it should be pluggable to a
real backend. Input to get from operator should also be an sever event."**
The human-in-the-loop "input needed" signal was riding on the mock's clock object (a
side-channel a real WebSocket wouldn't have). I asked the AI to make it protocol-driven.
- *Accepted:* promoting it to real `input.requested` / `input.cleared` events folded into
  `Call.pending`, so the UI depends only on the transport contract.
- *Edited:* I added the constraint **"the clock should not stop while waiting for operator
  input — a live call doesn't pause."** The AI's first version paused the clock at a
  checkpoint; I made it keep running (suspend only *event emission*, then rebase the
  remaining timeline). That distinction — server-side flow control vs. the media clock —
  was mine.


## How i verified the work 

Manual testing from the UI + proof reading code + unit and end to end test cases + another agent to critique implementation at regular intervals. 

## One edge case AI helped surface

 - endCall command updated the store optimistically (marking the call ended and hiding the dock), but the mock director never cleared its pending gate — so the blocking checkpoint modal stayed on screen over an already-ended call, and its "resume" path could still fire into a dead flow. The fix was to make endCall (and take-over) clear the open checkpoint and stop the clock.




