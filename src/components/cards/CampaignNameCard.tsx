"use client";

import { Pencil } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { AgentBubble } from "@/components/AgentBubble";
import { NoCampaign } from "@/components/NoCampaign";
import { StackCard } from "@/components/StackCard";
import { StatusMessage } from "@/components/StatusMessage";
import { CAMPAIGN_NAME_MAX_LENGTH } from "@/lib/campaignName";
import { useCampaignStore } from "@/store/campaignStore";

const TITLE = "The name of our campaign";
const TITLE_ID = "step-1-title";

const PRIMARY = "min-h-11 rounded-full bg-yellow px-5 font-bold text-ink";
const SECONDARY =
  "inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink/20 bg-white px-5 font-bold text-ink hover:border-burgundy";

export function CampaignNameCard() {
  const { name, setCampaignName } = useCampaignStore(
    useShallow((state) => ({
      name: state.campaign?.name,
      setCampaignName: state.setCampaignName,
    })),
  );

  if (name === undefined) {
    return (
      <StackCard step={1} title={TITLE}>
        <NoCampaign />
      </StackCard>
    );
  }

  return (
    <StackCard step={1} title={TITLE}>
      <NameEditor name={name} onSave={(draft) => setCampaignName(draft).ok} />
      {/* Hidden when it might not fit, so the card never scrolls. The worst
          case, 50 W's at 360px wide (5 lines), needs a 543px tall screen with
          the bubble; edit mode needs less. 552px leaves a little room. */}
      <AgentBubble atCardBottom className="pt-4 [@media(max-height:34.5rem)]:hidden">
        Hey! Scroll down to review the campaign.
      </AgentBubble>
    </StackCard>
  );
}

type NameEditorProps = {
  name: string;
  /** Gets the typed name. Returns false if it was not saved. */
  onSave: (draft: string) => boolean;
};

function NameEditor({ name, onSave }: NameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  /** Set when leaving edit mode, so the first render does not grab focus. */
  const returnFocus = useRef(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);

  function startEditing() {
    setDraft(name);
    setError(null);
    setEditing(true);
  }

  function stopEditing() {
    returnFocus.current = true;
    setEditing(false);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (draft.trim() === "") {
      setError("Give your campaign a name.");
      inputRef.current?.focus();
      return;
    }
    if (onSave(draft)) stopEditing();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      stopEditing();
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-[clamp(0.5rem,2svh,1rem)] short:gap-1">
        <p className="text-[clamp(1.625rem,min(7.5vw,6svh),3.5rem)] font-extrabold leading-tight text-plum [overflow-wrap:anywhere] short:text-2xl">
          {name}
        </p>
        <div className="flex justify-end">
          <button ref={editButtonRef} type="button" onClick={startEditing} className={SECONDARY}>
            <Pencil aria-hidden="true" className="size-4" />
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    // pt-1.5 keeps the input's focus ring inside the card body, which clips.
    <form onSubmit={save} noValidate className="flex flex-col gap-2 pt-1.5">
      {/* text-base or larger stops iPhones zooming in on focus. */}
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(event) => {
          // maxLength already cuts pastes short; this makes sure of it.
          setDraft(event.target.value.slice(0, CAMPAIGN_NAME_MAX_LENGTH));
          setError(null);
        }}
        onKeyDown={onKeyDown}
        maxLength={CAMPAIGN_NAME_MAX_LENGTH}
        autoComplete="off"
        aria-labelledby={TITLE_ID}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "campaign-name-error campaign-name-count" : "campaign-name-count"}
        className="min-h-12 w-full rounded-lg border-2 border-ink/20 bg-white px-3 py-2 text-[clamp(1rem,min(5vw,3.5svh),1.5rem)] font-bold text-ink aria-invalid:border-error"
      />
      {/* Room for one error line is always kept, so nothing jumps. */}
      <div className="flex min-h-9 items-start justify-between gap-3">
        <div role="alert" className="min-w-0">
          {error && <StatusMessage id="campaign-name-error" kind="error" text={error} />}
        </div>
        <p id="campaign-name-count" className="shrink-0 pt-2 text-sm text-muted tabular-nums">
          <span className="sr-only">Characters used: </span>
          {draft.length}/{CAMPAIGN_NAME_MAX_LENGTH}
        </p>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={stopEditing} className={SECONDARY}>
          Cancel
        </button>
        <button type="submit" className={PRIMARY}>
          Save
        </button>
      </div>
    </form>
  );
}
