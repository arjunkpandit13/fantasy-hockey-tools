import type { TeamMeta, Conference, Division } from "@/types/schedule";

/**
 * Static NHL team metadata (conference/division/full names). Abbreviations and
 * logos still come from the live data source; this table only supplies the
 * grouping and display names the schedule API does not include per-game.
 */
interface TeamSeed {
  abbrev: string;
  placeName: string;
  commonName: string;
  conference: Conference;
  division: Division;
}

const SEEDS: TeamSeed[] = [
  // Eastern - Atlantic
  { abbrev: "BOS", placeName: "Boston", commonName: "Bruins", conference: "Eastern", division: "Atlantic" },
  { abbrev: "BUF", placeName: "Buffalo", commonName: "Sabres", conference: "Eastern", division: "Atlantic" },
  { abbrev: "DET", placeName: "Detroit", commonName: "Red Wings", conference: "Eastern", division: "Atlantic" },
  { abbrev: "FLA", placeName: "Florida", commonName: "Panthers", conference: "Eastern", division: "Atlantic" },
  { abbrev: "MTL", placeName: "Montreal", commonName: "Canadiens", conference: "Eastern", division: "Atlantic" },
  { abbrev: "OTT", placeName: "Ottawa", commonName: "Senators", conference: "Eastern", division: "Atlantic" },
  { abbrev: "TBL", placeName: "Tampa Bay", commonName: "Lightning", conference: "Eastern", division: "Atlantic" },
  { abbrev: "TOR", placeName: "Toronto", commonName: "Maple Leafs", conference: "Eastern", division: "Atlantic" },
  // Eastern - Metropolitan
  { abbrev: "CAR", placeName: "Carolina", commonName: "Hurricanes", conference: "Eastern", division: "Metropolitan" },
  { abbrev: "CBJ", placeName: "Columbus", commonName: "Blue Jackets", conference: "Eastern", division: "Metropolitan" },
  { abbrev: "NJD", placeName: "New Jersey", commonName: "Devils", conference: "Eastern", division: "Metropolitan" },
  { abbrev: "NYI", placeName: "New York", commonName: "Islanders", conference: "Eastern", division: "Metropolitan" },
  { abbrev: "NYR", placeName: "New York", commonName: "Rangers", conference: "Eastern", division: "Metropolitan" },
  { abbrev: "PHI", placeName: "Philadelphia", commonName: "Flyers", conference: "Eastern", division: "Metropolitan" },
  { abbrev: "PIT", placeName: "Pittsburgh", commonName: "Penguins", conference: "Eastern", division: "Metropolitan" },
  { abbrev: "WSH", placeName: "Washington", commonName: "Capitals", conference: "Eastern", division: "Metropolitan" },
  // Western - Central
  { abbrev: "CHI", placeName: "Chicago", commonName: "Blackhawks", conference: "Western", division: "Central" },
  { abbrev: "COL", placeName: "Colorado", commonName: "Avalanche", conference: "Western", division: "Central" },
  { abbrev: "DAL", placeName: "Dallas", commonName: "Stars", conference: "Western", division: "Central" },
  { abbrev: "MIN", placeName: "Minnesota", commonName: "Wild", conference: "Western", division: "Central" },
  { abbrev: "NSH", placeName: "Nashville", commonName: "Predators", conference: "Western", division: "Central" },
  { abbrev: "STL", placeName: "St. Louis", commonName: "Blues", conference: "Western", division: "Central" },
  { abbrev: "UTA", placeName: "Utah", commonName: "Mammoth", conference: "Western", division: "Central" },
  { abbrev: "WPG", placeName: "Winnipeg", commonName: "Jets", conference: "Western", division: "Central" },
  // Western - Pacific
  { abbrev: "ANA", placeName: "Anaheim", commonName: "Ducks", conference: "Western", division: "Pacific" },
  { abbrev: "CGY", placeName: "Calgary", commonName: "Flames", conference: "Western", division: "Pacific" },
  { abbrev: "EDM", placeName: "Edmonton", commonName: "Oilers", conference: "Western", division: "Pacific" },
  { abbrev: "LAK", placeName: "Los Angeles", commonName: "Kings", conference: "Western", division: "Pacific" },
  { abbrev: "SEA", placeName: "Seattle", commonName: "Kraken", conference: "Western", division: "Pacific" },
  { abbrev: "SJS", placeName: "San Jose", commonName: "Sharks", conference: "Western", division: "Pacific" },
  { abbrev: "VAN", placeName: "Vancouver", commonName: "Canucks", conference: "Western", division: "Pacific" },
  { abbrev: "VGK", placeName: "Vegas", commonName: "Golden Knights", conference: "Western", division: "Pacific" },
];

function logoFor(abbrev: string): string {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;
}

export const TEAMS: Record<string, TeamMeta> = Object.fromEntries(
  SEEDS.map((s) => [
    s.abbrev,
    {
      abbrev: s.abbrev,
      placeName: s.placeName,
      commonName: s.commonName,
      name: `${s.placeName} ${s.commonName}`,
      conference: s.conference,
      division: s.division,
      logo: logoFor(s.abbrev),
    } satisfies TeamMeta,
  ]),
);

/** Fallback meta for an unknown abbrev (expansion/relocation safety). */
export function teamMetaFor(abbrev: string): TeamMeta {
  const known = TEAMS[abbrev];
  if (known) return known;
  return {
    abbrev,
    placeName: abbrev,
    commonName: "",
    name: abbrev,
    conference: "Eastern",
    division: "Atlantic",
    logo: logoFor(abbrev),
  };
}

export const ALL_TEAM_ABBREVS = SEEDS.map((s) => s.abbrev);
