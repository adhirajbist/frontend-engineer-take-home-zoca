# Lumen Campaign Builder

Live: [link](https://zoca-campaign-builder.vercel.app/) · Run: `npm install && npm run dev`
Stack: Next.js, TypeScript, Tailwind, Zustand.

## Key design decisions
**Scrolling cards instead of a wizard.** <br>Most builders are multi-step forms with a progress bar.
They feel formal and clumsy on a phone, and our owners work from one. Scrolling is the most natural
phone gesture, so each step is a card and the owner scrolls to the next, like Reels or Shorts. Cards
stack with the previous one peeking out, an idea from Zoca's site, which shows progress without a
progress bar. The palette also comes from Zoca's site.

**Progress without a progress bar.** <br>Each card shows "Step N of 6", and the stack shows what's behind
you. Going back is scrolling up, or tapping an edit icon on the final summary card, which jumps
straight to that step. The trade-off is that jumping mid-flow is less direct than a stepper.

**The AI is a teammate on every card.** <br>Steve, the agent, explains why each choice was made and says
how to change it.

**Built so a busy owner can't go wrong.** <br>Messages have character
limits (135 for text, 50 for email subject, 250 for email body). Messages show as the client would
see them. Reach is shown per channel. Launch is
blocked if a selected channel can reach nobody, past times can not be scheduled, and launch needs a confirmation.

**Message editor.** <br>Edit the text or email next to a live preview of what the client will see. Personalization tokens are added by tapping a chip, then tapping where the name should go, and can be removed with Backspace or a red cross. Undo and redo step back through changes. Error handling, and leaving with unsaved changes asks for confirmation.

**Segment builder.** <br>Inspired by Mixpanel's cohort filter. Filters combine with AND only, with a live
count of who gets a text and who gets an email, and a client table with just name, email and phone
(with opt-in icons), because that's all an owner needs to launch.

## What I cut
- The AI is a mock. Only the exact phrase "custom campaign" produces a draft; anything else gets Steve's
  "I need more detail" reply. The four preset campaigns, their messages, and the quick edits (shorter,
  friendlier, more urgent) are prewritten, and delays are simulated with `setTimeout`.
- No persistence: a refresh resets everything, including saved groups.
- No list of past or scheduled campaigns, only the status of the current one.

## With another week
- Connect a real model and let free-form prompts fill all four inputs.
- Persist data, and add a dashboard to see, edit and cancel campaigns.
- A place to edit and delete segments.
- A better large-screen layout: progress in a left panel and a live message preview on the right.