# Scripturi administrative SetItUp

Acest folder conține scripturi administrative care rulează local, în afara
aplicației Expo. Scriptul `cleanup-user.mjs` șterge complet datele unui singur
utilizator din Firebase.

> **Atenție:** operația executată cu `--execute` este ireversibilă. Rulează
> întotdeauna mai întâi simularea și verifică proiectul, emailul, UID-ul și toate
> resursele afișate.

## Ce șterge

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

## Simulare după email

Aceasta este forma recomandată pentru prima rulare:

```bash
npm run cleanup:user -- --email cont-de-sters@example.com
```

Scriptul afișează proiectul, utilizatorul, toate documentele Firestore găsite,
conversațiile șterse recursiv și fotografiile din Storage. Nu șterge nimic.

## Simulare după UID

```bash
npm run cleanup:user -- --uid UID_FIREBASE
```

## Ștergere reală

1. Rulează simularea.
2. Verifică fiecare resursă afișată.
3. Copiază UID-ul afișat.
4. Repetă comanda cu `--execute` și `--confirm UID`.

După email:

```bash
npm run cleanup:user -- \
  --email cont-de-sters@example.com \
  --execute \
  --confirm UID_AFISAT_DE_SIMULARE
```

După UID:

```bash
npm run cleanup:user -- \
  --uid UID_FIREBASE \
  --execute \
  --confirm UID_FIREBASE
```

Valoarea transmisă la `--confirm` trebuie să fie identică cu UID-ul contului.
Emailul nu este acceptat drept confirmare.

## Alt proiect sau alt bucket

Pentru a evita ștergerea accidentală în proiectul greșit, verifică atent
valorile afișate de simulare. Opțional, le poți transmite explicit:

```bash
npm run cleanup:user -- \
  --email cont@example.com \
  --project setitup-84173 \
  --bucket setitup-84173.firebasestorage.app
```

## Ajutor

```bash
npm run cleanup:user -- --help
```

## Probleme frecvente

### `Could not load the default credentials`

Rulează `gcloud auth application-default login` sau configurează
`GOOGLE_APPLICATION_CREDENTIALS` către o cheie administrativă păstrată în afara
repository-ului.

### `PERMISSION_DENIED`

Contul autentificat nu are permisiunile IAM necesare pentru Authentication,
Firestore sau Storage. Folosește un cont administrativ autorizat.

### Confirmare invalidă

Rulează din nou simularea și copiază exact UID-ul afișat după `UID:`. Nu folosi
emailul și nu introduce manual un UID aproximativ.

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
