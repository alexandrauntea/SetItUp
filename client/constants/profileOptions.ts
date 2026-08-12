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

export const INTEREST_OPTIONS = [
  // Artă, media și activități creative
  "Artă",
  "Design",
  "Fotografie",
  "Modă",
  "Scris",
  "Teatru",
  "Filme",
  "Seriale",
  "Documentare",
  "Anime",
  "Lectură",
  "Podcasturi",
  "Gaming",
  "Jocuri de societate",

  // Muzică și ieșiri
  "Muzică",
  "Concerte",
  "Festivaluri",
  "Dans",

  // Călătorii și activități în aer liber
  "Călătorii",
  "Natură",
  "Drumeții",
  "Camping",
  "Plajă",

  // Sport și mișcare
  "Sport",
  "Fitness",
  "Alergare",
  "Ciclism",
  "Înot",
  "Fotbal",
  "Baschet",
  "Tenis",
  "Sporturi de iarnă",
  "Yoga",

  // Mâncare și băuturi
  "Gătit",
  "Restaurante",
  "Cafea",
  "Vin",

  // Tehnologie, cunoaștere și carieră
  "Tehnologie",
  "Știință",
  "Istorie",
  "Limbi străine",
  "Antreprenoriat",

  // Animale și plante
  "Animale",
  "Câini",
  "Pisici",
  "Plante",

  // Stare de bine și valori
  "Dezvoltare personală",
  "Meditație",
  "Wellness",
  "Ecologie",
  "Voluntariat",
];
