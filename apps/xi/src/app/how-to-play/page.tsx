import { SimpleHeader } from "@/components/xi/SimpleHeader";

export const metadata = {
  title: "How to play — xi.",
};

const rules = [
  ["⚽", "Type a player's name to guess — first name, surname, or both. Small typos are forgiven."],
  ["🔢", "Each slot shows the squad number, position, and nationality flag as hints."],
  ["❤️", "You have 3 lives — a wrong guess costs one."],
  ["🏆", "Get all 22 right to win."],
] as const;

export default function HowToPlayPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SimpleHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">
          How to play xi<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground">
          A famous match is revealed every day. Guess the starting XI for both
          teams.
        </p>
        <ul className="space-y-4">
          {rules.map(([emoji, text]) => (
            <li key={text} className="flex gap-3">
              <span className="text-xl">{emoji}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Come back tomorrow for a new match.
        </p>
      </main>
    </div>
  );
}
