"use client";

/* eslint-disable @next/next/no-img-element */
import type { TeamMeta } from "@/types/schedule";

export function streamScoreClass(score: number): string {
  if (score >= 70) return "text-stream-hi";
  if (score >= 45) return "text-offnight";
  return "text-b2b";
}

export function TeamLogo({ team, size = 22 }: { team: TeamMeta; size?: number }) {
  return (
    <img
      src={team.logo}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0"
      // If a logo 404s (expansion/relocation), hide it rather than show a broken icon.
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
      }}
    />
  );
}
