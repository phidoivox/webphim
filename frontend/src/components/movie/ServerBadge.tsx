import React from "react";
import { MicIcon, SubtitlesIcon } from "@/components/ui/icons";

export interface ServerBadgeProps {
  name: string;
  langType?: string;
  isSelected?: boolean;
}

export function getServerIcon(name: string, langType?: string): string {
  const lower = (name + " " + (langType || "")).toLowerCase();
  if (
    lower.includes("song ngữ") ||
    lower.includes("song ngu") ||
    lower.includes("bilingual") ||
    lower.includes("ai")
  ) {
    return "文A";
  }
  if (
    lower.includes("lồng tiếng") ||
    lower.includes("long tieng") ||
    lower.includes("thuyết minh") ||
    lower.includes("thuyet minh") ||
    lower.includes("dub") ||
    lower.includes("voice")
  ) {
    return "🎙";
  }
  if (lower.includes("vietsub") || lower.includes("sub") || lower.includes("raw")) {
    return "📺";
  }
  return "⚡";
}

export function ServerIconComponent({
  name,
  langType,
  isSelected = false,
}: ServerBadgeProps) {
  const lower = (name + " " + (langType || "")).toLowerCase();
  if (
    lower.includes("song ngữ") ||
    lower.includes("song ngu") ||
    lower.includes("bilingual") ||
    lower.includes("ai")
  ) {
    return (
      <span className={`text-xs font-black ${isSelected ? "text-white" : "text-gray-400"}`}>
        文A
      </span>
    );
  }
  if (
    lower.includes("lồng tiếng") ||
    lower.includes("long tieng") ||
    lower.includes("thuyết minh") ||
    lower.includes("thuyet minh") ||
    lower.includes("dub") ||
    lower.includes("voice")
  ) {
    return (
      <MicIcon className={`h-4 w-4 shrink-0 ${isSelected ? "text-white" : "text-gray-400"}`} />
    );
  }
  return (
    <SubtitlesIcon className={`h-4 w-4 shrink-0 ${isSelected ? "text-white" : "text-gray-400"}`} />
  );
}

export default ServerIconComponent;
