// Lightweight Levenshtein distance for fuzzy surname matching (allow 1–2 typos).

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// Strip accents/diacritics and lowercase so "Schmeichel" === "schmeichel" and
// "Mbappé" matches "mbappe".
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Allowed typo tolerance scales with word length so short names aren't
// over-matched (e.g. "Kane" shouldn't match "Bale").
function allowedDistance(len: number): number {
  if (len <= 4) return 1;
  if (len <= 8) return 2;
  return 2;
}

// Does `guess` fuzzily match the target surname?
export function surnameMatches(guess: string, surname: string): boolean {
  const g = normalize(guess);
  const s = normalize(surname);
  if (!g) return false;
  if (g === s) return true;
  const dist = levenshtein(g, s);
  return dist <= allowedDistance(s.length);
}

// Does `guess` match any part of a player's name — surname, first name, or
// the full "First Surname" string? Used when full-name input is allowed.
export function nameMatches(
  guess: string,
  player: { name: string; surname: string },
): boolean {
  const g = normalize(guess);
  if (!g || g.length < 2) return false;

  const s = normalize(player.surname);
  const n = normalize(player.name);
  const full = `${n} ${s}`;

  if (g === s || g === n || g === full) return true;
  if (levenshtein(g, s) <= allowedDistance(s.length)) return true;
  if (
    n.length >= 3 &&
    g.length >= 3 &&
    levenshtein(g, n) <= allowedDistance(n.length)
  )
    return true;

  return false;
}
