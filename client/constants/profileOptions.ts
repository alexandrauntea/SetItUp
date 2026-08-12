import type { Gender } from "@/types/profile";

type GenderOption = {
  label: string;
  value: Gender;
};

export const GENDER_OPTIONS: GenderOption[] = [
  { label: "Feminin", value: "female" },
  { label: "Masculin", value: "male" },
  { label: "Altul", value: "other" },
];

export const INTEREST_CATEGORIES = [
  {
    id: "creative",
    label: "Artă & divertisment",
    interests: [
      "Artă", "Design", "Fotografie", "Modă", "Scris", "Teatru",
      "Filme", "Seriale", "Documentare", "Anime", "Lectură",
      "Podcasturi", "Gaming", "Jocuri de societate",
    ],
  },
  {
    id: "music",
    label: "Muzică & ieșiri",
    interests: ["Muzică", "Concerte", "Festivaluri", "Dans"],
  },
  {
    id: "travel",
    label: "Călătorii & natură",
    interests: ["Călătorii", "Natură", "Drumeții", "Camping", "Plajă"],
  },
  {
    id: "sport",
    label: "Sport & mișcare",
    interests: [
      "Sport", "Fitness", "Alergare", "Ciclism", "Înot", "Fotbal",
      "Baschet", "Tenis", "Sporturi de iarnă", "Yoga",
    ],
  },
  {
    id: "food",
    label: "Mâncare & băuturi",
    interests: ["Gătit", "Restaurante", "Cafea", "Vin"],
  },
  {
    id: "knowledge",
    label: "Tehnologie & cunoaștere",
    interests: [
      "Tehnologie", "Știință", "Istorie", "Limbi străine", "Antreprenoriat",
    ],
  },
  {
    id: "pets",
    label: "Animale & plante",
    interests: ["Animale", "Câini", "Pisici", "Plante"],
  },
  {
    id: "wellbeing",
    label: "Wellness & valori",
    interests: [
      "Dezvoltare personală", "Meditație", "Wellness", "Ecologie",
      "Voluntariat",
    ],
  },
] as const;

export const INTEREST_OPTIONS = INTEREST_CATEGORIES.flatMap(
  (category) => category.interests,
);
