"use client";

import { Loader2, Search, Shield, Shirt } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { normalizePosition, resolveNationality } from "@/lib/game/difficulty";
import { referenceClub, referencePlayer } from "@/lib/game/reducer";
import type { ChainLink } from "@/lib/game/types";
import { searchClubsAction, searchPlayersAction } from "@/lib/sportsdb/actions";
import { normalizeClubName } from "@/lib/sportsdb/normalize";
import type { ClubResult, PlayerResult } from "@/lib/sportsdb/types";
import { useGame } from "./game-provider";

type Suggestion = ClubResult | PlayerResult;

export function AnswerInput() {
  const { state, dispatch, verifyLink } = useGame();
  const lookingForPlayer = state.turnKind === "player";
  const refClub = referenceClub(state);
  const refPlayer = referencePlayer(state);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const debounced = useDebouncedValue(query, 350);
  const requestId = useRef(0);

  // Fetch context-aware suggestions as the player types.
  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    const id = ++requestId.current;
    setSearching(true);
    const run = lookingForPlayer
      ? searchPlayersAction(q)
      : searchClubsAction(q);
    run
      .then((res) => {
        if (id === requestId.current) setResults(res);
      })
      .catch(() => {
        if (id === requestId.current) setResults([]);
      })
      .finally(() => {
        if (id === requestId.current) setSearching(false);
      });
  }, [debounced, lookingForPlayer]);

  async function handlePick(item: Suggestion) {
    if (checking) return;
    setNotice(null);

    // Enforce the "no club or player used twice" rule before any API call.
    if (lookingForPlayer) {
      if (state.usedPlayerIds.includes(item.id)) {
        toast.warning(
          `${item.name} is already in the chain — pick someone else.`,
        );
        return;
      }
    } else {
      const club = item as ClubResult;
      if (
        state.usedClubIds.includes(club.id) ||
        state.usedClubNames.includes(normalizeClubName(club.name))
      ) {
        toast.warning(
          `${club.name} is already in the chain — pick another club.`,
        );
        return;
      }
    }

    const playerId = lookingForPlayer ? item.id : refPlayer?.id;
    const club = lookingForPlayer ? refClub : { id: item.id, name: item.name };
    if (!playerId || !club) return;

    setChecking(true);
    const result = await verifyLink(playerId, club.id, club.name);
    setChecking(false);

    if (result.status === "valid") {
      // Enforce restrictions after the link is confirmed — search result metadata
      // (nationality, position) uses different formats than the restriction values
      // and can be null, so checking it upfront causes false rejections.
      if (lookingForPlayer) {
        const player = item as PlayerResult;
        const { nationality, position } = state.config.restrictions;

        if (nationality && player.nationality && resolveNationality(player.nationality) !== nationality) {
          dispatch({ type: "FAIL", reason: "wrong", attempted: item.name });
          return;
        }
        if (position && player.position && normalizePosition(player.position) !== position) {
          dispatch({ type: "FAIL", reason: "wrong", attempted: item.name });
          return;
        }
      }

      const link: ChainLink = lookingForPlayer
        ? {
            kind: "player",
            id: item.id,
            name: item.name,
            linkedClubId: refClub?.id ?? null,
            teamName: (item as PlayerResult).teamName,
          }
        : {
            kind: "club",
            id: item.id,
            name: item.name,
            badge: (item as ClubResult).badge,
          };
      toast.success(`${item.name} — good link!`);
      dispatch({ type: "SUBMIT_VALID", link });
      return;
    }

    if (result.status === "contradicted") {
      dispatch({
        type: "FAIL",
        reason: "wrong",
        attempted: item.name,
        knownClubs: result.knownClubs,
      });
      return;
    }

    if (result.status === "unconfirmed") {
      setNotice(
        `The database can't confirm ${item.name}'s${lookingForPlayer ? "" : ""} link. Pick an answer it can verify.`,
      );
      return;
    }

    // error
    setNotice(
      "Couldn't reach the football database. Check your connection and try again.",
    );
  }

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-lg border bg-card shadow-sm">
        <Command shouldFilter={false} className="bg-card">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            disabled={checking}
            placeholder={
              lookingForPlayer ? "Search for a player…" : "Search for a club…"
            }
            autoFocus
          />
          {debounced.trim().length >= 2 && (
            <CommandList>
              {searching && results.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Searching…
                </div>
              ) : (
                <CommandEmpty>No matches found.</CommandEmpty>
              )}
              {results.map((item) => (
                <SuggestionRow
                  key={item.id}
                  item={item}
                  isPlayer={lookingForPlayer}
                  onPick={() => handlePick(item)}
                />
              ))}
            </CommandList>
          )}
        </Command>

        {checking && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-card/85 text-sm font-medium backdrop-blur-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Checking the link…
          </div>
        )}
      </div>

      {notice && (
        <p className="mt-2 flex items-start gap-2 text-sm text-destructive">
          <Search className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {notice}
        </p>
      )}
    </div>
  );
}

function SuggestionRow({
  item,
  isPlayer,
  onPick,
}: {
  item: Suggestion;
  isPlayer: boolean;
  onPick: () => void;
}) {
  const badge = !isPlayer ? (item as ClubResult).badge : null;
  const subtitle = isPlayer
    ? [(item as PlayerResult).position, (item as PlayerResult).nationality]
        .filter(Boolean)
        .join(" · ")
    : [(item as ClubResult).country].filter(Boolean).join(" · ");

  return (
    <CommandItem value={item.id} onSelect={onPick} className="gap-3 py-2.5">
      <div className={cnBox(isPlayer)} aria-hidden>
        {badge ? (
          <Image
            src={badge}
            alt=""
            width={36}
            height={36}
            className="size-full object-contain p-0.5"
            unoptimized
          />
        ) : isPlayer ? (
          <Shirt className="size-4 text-muted-foreground" />
        ) : (
          <Shield className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{item.name}</span>
        {subtitle && (
          <span className="truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
    </CommandItem>
  );
}

function cnBox(isPlayer: boolean): string {
  return `flex size-9 shrink-0 items-center justify-center overflow-hidden ${
    isPlayer ? "rounded-full bg-muted" : "rounded-md"
  }`;
}
