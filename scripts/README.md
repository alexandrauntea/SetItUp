# Scripturi administrative SetItUp

Acest folder conține scripturi administrative care rulează local, în afara
aplicației Expo:

- `cleanup-user.mjs` șterge complet datele unui singur utilizator din Firebase;
- `cleanup-unmatched-reactions.mjs` elimină reacțiile care nu au produs o
  potrivire.

> **Atenție:** operația executată cu `--execute` este ireversibilă. Rulează
> întotdeauna mai întâi simularea și verifică proiectul, emailul, UID-ul și toate
> resursele afișate.

## Ștergerea unui utilizator

Contul este selectat exclusiv prin adresa de email. UID-ul afișat în simulare este
doar informativ și nu poate fi folosit ca argument pentru ștergere.

### Ce șterge

Pentru utilizatorul selectat, scriptul caută și elimină:

- contul din Firebase Authentication;
- profilul privat din `users`;
- profilul public din `publicProfiles`;
- intrarea corespunzătoare din `usernames`;
- preferințele din `preferences`;
- fotografiile din `profilePhotos/{uid}/` în Cloud Storage;
- cererile de prietenie și prieteniile;
- cererile, rolurile și relațiile manager–owner;
- reacțiile, like-urile, dislike-urile și potrivirile;
- blocările;
- conversațiile și subcolecțiile lor `messages`.

Authentication este șters ultimul. Astfel, dacă o operație intermediară
eșuează, scriptul poate fi rulat din nou pentru același utilizator.

Relațiile comune sunt șterse integral. De exemplu, eliminarea unei prietenii,
potriviri sau conversații va fi vizibilă și pentru celălalt participant.

## Cerințe

- Node.js 20 sau mai nou;
- npm;
- acces administrativ la proiectul Firebase `setitup-84173`;
- Google Cloud CLI (`gcloud`) sau o altă metodă Application Default
  Credentials.

Versiunile exacte ale dependențelor sunt salvate în `package-lock.json`.

## Instalare

Din rădăcina repository-ului:

```bash
cd scripts
npm ci
```

`npm ci` instalează Firebase Admin SDK conform fișierului `package-lock.json`.
Folderul `node_modules` nu trebuie încărcat pe GitHub.

## Autentificare locală recomandată

Autentifică-te cu un cont care are acces la proiect:

```bash
gcloud auth application-default login
```

Poți verifica proiectul disponibil astfel:

```bash
gcloud config get-value project
```

Scriptul folosește implicit proiectul `setitup-84173`, indiferent de proiectul
activ din configurația `gcloud`.

### Alternativă: service account

În medii unde Application Default Login nu este disponibil, setează calea către
un fișier service-account păstrat **în afara repository-ului**:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/cale/sigura/firebase-admin.json"
```

Nu încărca niciodată cheia service-account pe GitHub și nu o trimite altor
persoane prin chat sau email.

## Protejarea conturilor pentru prezentare

Înainte de simulare, definește conturile care nu trebuie șterse:

```bash
export PROTECTED_EMAILS="owner.demo@example.com,manager.demo@example.com"
```

Poți adăuga un singur email protejat și direct în comandă:

```bash
npm run cleanup:user -- \
  --email cont@example.com \
  --protect-email owner.demo@example.com
```

Dacă utilizatorul selectat se află în lista protejată, scriptul se oprește.

### Simulare

Aceasta este forma recomandată pentru prima rulare:

```bash
npm run cleanup:user -- --email cont-de-sters@example.com
```

Scriptul afișează proiectul, utilizatorul, toate documentele Firestore găsite,
conversațiile șterse recursiv și fotografiile din Storage. Nu șterge nimic.

### Ștergere reală

1. Rulează simularea.
2. Verifică fiecare resursă afișată.
3. Repetă comanda cu `--execute` și confirmă exact emailul contului.

```bash
npm run cleanup:user -- \
  --email cont-de-sters@example.com \
  --execute \
  --confirm cont-de-sters@example.com
```

Scriptul acceptă selectarea contului numai după email. Valoarea transmisă la
`--confirm` trebuie să fie aceeași adresă; comparația nu ține cont de litere
mari sau mici.

### Alt proiect sau alt bucket

Pentru a evita ștergerea accidentală în proiectul greșit, verifică atent
valorile afișate de simulare. Opțional, le poți transmite explicit:

```bash
npm run cleanup:user -- \
  --email cont@example.com \
  --project setitup-84173 \
  --bucket setitup-84173.firebasestorage.app
```

### Ajutor

```bash
npm run cleanup:user -- --help
```

## Curățarea reacțiilor fără potrivire

Scriptul verifică toate documentele din `reactions` și păstrează reacțiile
dintre două persoane dacă există potrivirea lor în `matches`. Sunt eliminate
numai reacțiile perechilor care nu au ajuns la o potrivire. Astfel, profilurile
respective pot reveni în feed, în timp ce potrivirile și conversațiile valide
rămân intacte.

Documentele de reacție cu `ownerId` sau `targetId` lipsă ori invalid sunt
raportate, dar nu sunt șterse automat. În timpul execuției, existența potrivirii
este verificată din nou într-o tranzacție înainte de fiecare ștergere. Dacă o
potrivire tocmai a fost creată, reacția este păstrată.

### Simulare

```bash
npm run cleanup:reactions
```

Simularea afișează numărul total de reacții și potriviri, reacțiile păstrate,
reacțiile invalide și lista exactă a reacțiilor care ar fi șterse, fără să
modifice Firebase.

### Ștergere reală

Rulează mai întâi simularea și verifică lista completă. Apoi execută:

```bash
npm run cleanup:reactions -- \
  --execute \
  --confirm DELETE_UNMATCHED_REACTIONS
```

Pentru alt proiect:

```bash
npm run cleanup:reactions -- \
  --project setitup-84173
```

### Ajutor

```bash
npm run cleanup:reactions -- --help
```

## Probleme frecvente

### `Could not load the default credentials`

Rulează `gcloud auth application-default login` sau configurează
`GOOGLE_APPLICATION_CREDENTIALS` către o cheie administrativă păstrată în afara
repository-ului.

### `PERMISSION_DENIED`

Contul autentificat nu are permisiunile IAM necesare pentru Authentication,
Firestore sau Storage. Folosește un cont administrativ autorizat.

### Confirmare invalidă la ștergerea unui utilizator

Rulează din nou simularea și folosește exact emailul afișat pentru opțiunea
`--confirm`.

Pentru curățarea reacțiilor, confirmarea este textul fix afișat de simulare:
`DELETE_UNMATCHED_REACTIONS`.

### Operația s-a oprit după ce a șters doar o parte din date

Authentication este eliminat ultimul, deci poți rula din nou întâi simularea,
apoi aceeași comandă cu `--execute`. Scriptul va găsi numai resursele rămase.

## Recomandări înainte de prezentare

1. Realizează un export/backup Firestore.
2. Stabilește lista exactă a conturilor-demo păstrate.
3. Setează `PROTECTED_EMAILS`.
4. Rulează simularea separat pentru fiecare cont eliminat.
5. Verifică relațiile comune și conversațiile afișate.
6. Execută ștergerea numai după verificare.
7. Testează scenariul complet al prezentării cu datele rămase.
