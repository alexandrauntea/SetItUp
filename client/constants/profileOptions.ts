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
  "Tehnologie",
  "Muzică",
  "Călătorii",
  "Sport",
  "Filme",
  "Gaming",
  "Lectură",
  "Artă",
];
