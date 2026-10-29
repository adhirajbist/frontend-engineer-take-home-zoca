/**
 * What Steve says on each card. In memory only, like the campaign store.
 *
 * The campaign store fills and clears it, so this file must never import the
 * campaign store (that would be a circular import).
 */
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { AgentCardKey, AgentNote, AgentNotes, ReasonCardKey } from "@/types";

type Dismissed = Record<ReasonCardKey, boolean>;

export type AgentNotesState = {
  notes: AgentNotes | null;
  /** True once the owner changed what Steve picked, so his reason no longer applies. */
  dismissed: Dismissed;
  /** Also brings every reason back. */
  setNotes: (notes: AgentNotes) => void;
  dismissReason: (card: ReasonCardKey) => void;
  clearNotes: () => void;
};

const NONE_DISMISSED: Dismissed = { channel: false, audience: false, time: false };

export const useAgentNotesStore = create<AgentNotesState>()((set) => ({
  notes: null,
  dismissed: NONE_DISMISSED,
  setNotes: (notes) => set({ notes, dismissed: NONE_DISMISSED }),
  dismissReason: (card) =>
    set((state) =>
      state.dismissed[card] ? {} : { dismissed: { ...state.dismissed, [card]: true } },
    ),
  clearNotes: () => set({ notes: null, dismissed: NONE_DISMISSED }),
}));

function isReasonCard(card: AgentCardKey): card is ReasonCardKey {
  return card in NONE_DISMISSED;
}

/** A card's note, without the reason once it is dismissed. Null when there are no notes. */
export function selectCardNote(state: AgentNotesState, card: AgentCardKey): AgentNote | null {
  const note = state.notes?.[card];
  if (!note) return null;
  const dismissed = isReasonCard(card) && state.dismissed[card];
  return note.reason && !dismissed
    ? { reason: note.reason, neutral: note.neutral }
    : { neutral: note.neutral };
}

export function useCardNote(card: AgentCardKey): AgentNote | null {
  return useAgentNotesStore(useShallow((state) => selectCardNote(state, card)));
}
