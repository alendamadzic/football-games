/**
 * Strips accents, football affixes and punctuation so club names from
 * different sources can be compared (e.g. "Inter" vs "Internazionale FC").
 * Dependency-free so it is safe to use in both server and client code.
 */
export function normalizeClubName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\b(fc|cf|afc|sc|ac|cd|ss|as|ssc|club|de|the)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
