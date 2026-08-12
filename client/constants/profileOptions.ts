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
      "Fotografie",
      "Design",
      "Desen",
      "Pictură",
      "Scris",
      "Teatru",
      "Filme",
      "Lectură",
      "Gaming",
    ],
  },
  {
    id: "music",
    label: "Muzică & activități",
    interests: [
      "Muzică",
      "Concerte",
      "Festivaluri",
      "Dans",
      "Karaoke",
      "Cluburi",
      "Stand-up comedy",
      "Muzee",
      "Jocuri de societate",
    ],
  },
  {
    id: "travel",
    label: "Călătorii & natură",
    interests: [
      "Călătorii",
      "Drumeții",
      "Camping",
      "Plajă",
      "Munți",
      "City break-uri",
      "Excursii cu mașina",
      "Aventură",
      "Pescuit",
    ],
  },
  {
    id: "sport",
    label: "Sport & mișcare",
    interests: [
      "Fitness",
      "Alergare",
      "Ciclism",
      "Înot",
      "Fotbal",
      "Baschet",
      "Tenis",
      "Sporturi de iarnă",
      "Yoga",
    ],
  },
  {
    id: "food",
    label: "Mâncare & băuturi",
    interests: [
      "Gătit",
      "Restaurante",
      "Cafea",
      "Vin",
      "Brunch",
      "Deserturi",
      "Cocktailuri",
      "Mâncare vegetariană",
      "Street food",
    ],
  },
  {
    id: "knowledge",
    label: "Tehnologie & cunoaștere",
    interests: [
      "Tehnologie",
      "Știință",
      "Istorie",
      "Limbi străine",
      "Antreprenoriat",
      "Astronomie",
      "Psihologie",
      "Programare",
      "Finanțe",
    ],
  },
  {
    id: "pets",
    label: "Animale & plante",
    interests: [
      "Câini",
      "Pisici",
      "Plante de apartament",
      "Grădinărit",
      "Cai",
      "Păsări",
      "Acvaristică",
      "Reptile",
      "Protecția animalelor",
    ],
  },
  {
    id: "wellbeing",
    label: "Wellness & valori",
    interests: [
      "Dezvoltare personală",
      "Meditație",
      "Mindfulness",
      "Îngrijire personală",
      "Pozitivitate",
      "Spiritualitate",
      "Ecologie",
      "Voluntariat",
      "Egalitate",
    ],
  },
] as const;

export const INTEREST_OPTIONS = INTEREST_CATEGORIES.flatMap(
  (category) => category.interests,
);
