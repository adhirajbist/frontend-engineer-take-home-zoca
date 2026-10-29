"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState } from "react";
import { askSteve } from "@/ai/steve";
import { CAMPAIGN_PATH } from "@/lib/editorRoutes";
import { getAnnouncement, INITIAL_STEVE_FLOW, isBusy, steveFlowReducer } from "@/lib/steveFlow";
import { useCampaignStore } from "@/store/campaignStore";
import { CampaignList } from "./CampaignList";
import { PromptBox } from "./PromptBox";
import { SteveIntro } from "./SteveIntro";

export function Landing() {
  const router = useRouter();
  const selectPresetCampaign = useCampaignStore((state) => state.selectPresetCampaign);
  const [flow, dispatch] = useReducer(steveFlowReducer, INITIAL_STEVE_FLOW);
  const [prompt, setPrompt] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const busy = isBusy(flow);

  // Clears Steve's timer if the owner leaves while he is thinking.
  useEffect(() => () => requestRef.current?.abort(), []);

  // The textarea was disabled while Steve thought, so focus needs a new home.
  useEffect(() => {
    if (flow.phase === "needs-detail") textareaRef.current?.focus();
    if (flow.phase === "ready") ctaRef.current?.focus();
  }, [flow.phase, flow.request]);

  function send() {
    if (busy || prompt.trim() === "") return;
    // A new request replaces the old one; its reply is dropped.
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const request = flow.request + 1;
    dispatch({ type: "send" });
    askSteve(prompt, { signal: controller.signal }).then(
      (reply) => {
        if (controller.signal.aborted) return;
        if (reply.kind === "ready") selectPresetCampaign(reply.presetId);
        dispatch({ type: "reply", request, reply });
      },
      // Only rejects when aborted, and then the reply is not wanted.
      () => {},
    );
  }

  function pick(presetId: string) {
    selectPresetCampaign(presetId);
    router.push(CAMPAIGN_PATH);
  }

  return (
    // The document never scrolls (see globals.css), so this page scrolls itself.
    <main className="flex h-svh flex-col overflow-y-auto">
      {/* m-auto centres the group when there is room, and starts at the top when not. */}
      <div className="m-auto flex w-full max-w-180 flex-col gap-6 px-4 py-8 sm:px-6">
        <h1 className="sr-only">Lumen Campaigns</h1>
        <SteveIntro flow={flow} ctaRef={ctaRef} />
        <p role="status" aria-live="polite" className="sr-only">
          {getAnnouncement(flow)}
        </p>
        <PromptBox
          value={prompt}
          onChange={setPrompt}
          onSend={send}
          disabled={busy}
          textareaRef={textareaRef}
        />
        <CampaignList disabled={busy} onPick={pick} />
      </div>
    </main>
  );
}
