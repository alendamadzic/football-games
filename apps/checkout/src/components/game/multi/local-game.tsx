"use client";

import { useState } from "react";
import { LocalGameProvider } from "@/components/game/multi/local-game-provider";
import { LocalSetup } from "@/components/game/multi/local-setup";
import { MultiGameBoard } from "@/components/game/multi/multi-game-board";
import { SubjectPicker } from "@/components/game/subject-picker";
import type { Subject } from "@/lib/subjects";

/** Pass-the-device flow: chalk up names → pick a board → play. */
export function LocalGame({ startScore }: { startScore: number }) {
  const [names, setNames] = useState<string[] | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [limit180, setLimit180] = useState(false);

  if (!names) {
    return <LocalSetup onStart={setNames} />;
  }

  if (!subject) {
    return (
      <SubjectPicker
        onPick={setSubject}
        limit180={limit180}
        onLimit180Change={setLimit180}
      />
    );
  }

  return (
    <LocalGameProvider
      names={names}
      subject={subject}
      startScore={startScore}
      limit180={limit180}
      onNewBoard={() => setSubject(null)}
      onNewPlayers={() => {
        setSubject(null);
        setNames(null);
      }}
    >
      <MultiGameBoard />
    </LocalGameProvider>
  );
}
