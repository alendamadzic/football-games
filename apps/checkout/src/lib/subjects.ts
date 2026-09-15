export type SubjectKind = "club" | "nation";

/** 1 = generous board (huge one-club legends), 3 = tricky finish (lower totals, deeper cuts needed). */
export type SubjectTier = 1 | 2 | 3;

export interface Subject {
  /** Transfermarkt club id — nations are clubs too. */
  id: string;
  name: string;
  shortName: string;
  kind: SubjectKind;
  tier: SubjectTier;
  /** e.g. "Premier League" or "UEFA" region for nations — used as a subtitle. */
  detail: string;
}

export function subjectCrestUrl(subject: Subject): string {
  // The "head" variant is a 0-byte file for some national teams; "big" is reliable.
  return `https://tmssl.akamaized.net/images/wappen/big/${subject.id}.png`;
}

/** All ids verified against tmapi.transfermarkt.technology/club/{id} on 2026-07-09. */
export const SUBJECTS: Subject[] = [
  // ── Clubs ──────────────────────────────────────────────────────────
  {
    id: "418",
    name: "Real Madrid",
    shortName: "Real Madrid",
    kind: "club",
    tier: 1,
    detail: "LaLiga",
  },
  {
    id: "131",
    name: "FC Barcelona",
    shortName: "Barcelona",
    kind: "club",
    tier: 1,
    detail: "LaLiga",
  },
  {
    id: "13",
    name: "Atlético de Madrid",
    shortName: "Atlético",
    kind: "club",
    tier: 2,
    detail: "LaLiga",
  },
  {
    id: "985",
    name: "Manchester United",
    shortName: "Man United",
    kind: "club",
    tier: 1,
    detail: "Premier League",
  },
  {
    id: "31",
    name: "Liverpool FC",
    shortName: "Liverpool",
    kind: "club",
    tier: 1,
    detail: "Premier League",
  },
  {
    id: "11",
    name: "Arsenal FC",
    shortName: "Arsenal",
    kind: "club",
    tier: 1,
    detail: "Premier League",
  },
  {
    id: "631",
    name: "Chelsea FC",
    shortName: "Chelsea",
    kind: "club",
    tier: 2,
    detail: "Premier League",
  },
  {
    id: "281",
    name: "Manchester City",
    shortName: "Man City",
    kind: "club",
    tier: 2,
    detail: "Premier League",
  },
  {
    id: "148",
    name: "Tottenham Hotspur",
    shortName: "Spurs",
    kind: "club",
    tier: 2,
    detail: "Premier League",
  },
  {
    id: "762",
    name: "Newcastle United",
    shortName: "Newcastle",
    kind: "club",
    tier: 3,
    detail: "Premier League",
  },
  {
    id: "27",
    name: "Bayern Munich",
    shortName: "Bayern",
    kind: "club",
    tier: 1,
    detail: "Bundesliga",
  },
  {
    id: "16",
    name: "Borussia Dortmund",
    shortName: "Dortmund",
    kind: "club",
    tier: 2,
    detail: "Bundesliga",
  },
  {
    id: "15",
    name: "Bayer 04 Leverkusen",
    shortName: "Leverkusen",
    kind: "club",
    tier: 3,
    detail: "Bundesliga",
  },
  {
    id: "506",
    name: "Juventus FC",
    shortName: "Juventus",
    kind: "club",
    tier: 1,
    detail: "Serie A",
  },
  {
    id: "5",
    name: "AC Milan",
    shortName: "Milan",
    kind: "club",
    tier: 1,
    detail: "Serie A",
  },
  {
    id: "46",
    name: "Inter Milan",
    shortName: "Inter",
    kind: "club",
    tier: 2,
    detail: "Serie A",
  },
  {
    id: "6195",
    name: "SSC Napoli",
    shortName: "Napoli",
    kind: "club",
    tier: 3,
    detail: "Serie A",
  },
  {
    id: "12",
    name: "AS Roma",
    shortName: "Roma",
    kind: "club",
    tier: 2,
    detail: "Serie A",
  },
  {
    id: "583",
    name: "Paris Saint-Germain",
    shortName: "PSG",
    kind: "club",
    tier: 2,
    detail: "Ligue 1",
  },
  {
    id: "244",
    name: "Olympique Marseille",
    shortName: "Marseille",
    kind: "club",
    tier: 3,
    detail: "Ligue 1",
  },
  {
    id: "1041",
    name: "Olympique Lyon",
    shortName: "Lyon",
    kind: "club",
    tier: 3,
    detail: "Ligue 1",
  },
  {
    id: "162",
    name: "AS Monaco",
    shortName: "Monaco",
    kind: "club",
    tier: 3,
    detail: "Ligue 1",
  },
  {
    id: "610",
    name: "Ajax Amsterdam",
    shortName: "Ajax",
    kind: "club",
    tier: 2,
    detail: "Eredivisie",
  },
  {
    id: "720",
    name: "FC Porto",
    shortName: "Porto",
    kind: "club",
    tier: 2,
    detail: "Liga Portugal",
  },
  {
    id: "294",
    name: "SL Benfica",
    shortName: "Benfica",
    kind: "club",
    tier: 2,
    detail: "Liga Portugal",
  },
  {
    id: "336",
    name: "Sporting CP",
    shortName: "Sporting",
    kind: "club",
    tier: 3,
    detail: "Liga Portugal",
  },
  {
    id: "371",
    name: "Celtic FC",
    shortName: "Celtic",
    kind: "club",
    tier: 3,
    detail: "Scottish Premiership",
  },
  {
    id: "124",
    name: "Rangers FC",
    shortName: "Rangers",
    kind: "club",
    tier: 3,
    detail: "Scottish Premiership",
  },

  // ── Nations (senior caps only — routes need more names) ───────────
  {
    id: "3437",
    name: "Argentina",
    shortName: "Argentina",
    kind: "nation",
    tier: 2,
    detail: "CONMEBOL",
  },
  {
    id: "3439",
    name: "Brazil",
    shortName: "Brazil",
    kind: "nation",
    tier: 2,
    detail: "CONMEBOL",
  },
  {
    id: "3449",
    name: "Uruguay",
    shortName: "Uruguay",
    kind: "nation",
    tier: 3,
    detail: "CONMEBOL",
  },
  {
    id: "3299",
    name: "England",
    shortName: "England",
    kind: "nation",
    tier: 2,
    detail: "UEFA",
  },
  {
    id: "3377",
    name: "France",
    shortName: "France",
    kind: "nation",
    tier: 2,
    detail: "UEFA",
  },
  {
    id: "3262",
    name: "Germany",
    shortName: "Germany",
    kind: "nation",
    tier: 2,
    detail: "UEFA",
  },
  {
    id: "3375",
    name: "Spain",
    shortName: "Spain",
    kind: "nation",
    tier: 2,
    detail: "UEFA",
  },
  {
    id: "3376",
    name: "Italy",
    shortName: "Italy",
    kind: "nation",
    tier: 2,
    detail: "UEFA",
  },
  {
    id: "3300",
    name: "Portugal",
    shortName: "Portugal",
    kind: "nation",
    tier: 2,
    detail: "UEFA",
  },
  {
    id: "3379",
    name: "Netherlands",
    shortName: "Netherlands",
    kind: "nation",
    tier: 3,
    detail: "UEFA",
  },
  {
    id: "3382",
    name: "Belgium",
    shortName: "Belgium",
    kind: "nation",
    tier: 3,
    detail: "UEFA",
  },
  {
    id: "3556",
    name: "Croatia",
    shortName: "Croatia",
    kind: "nation",
    tier: 3,
    detail: "UEFA",
  },
];

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find((subject) => subject.id === id);
}
