# SetItUp — ghidul proiectului

SetItUp este o aplicație mobilă socială construită cu Expo și Firebase. Un utilizator își creează profilul, își adaugă prieteni și desemnează un prieten de încredere drept manager. Managerul folosește recomandările și potrivirile în numele proprietarului profilului.

Acest README este documentul unic pentru arhitectura, regulile și starea proiectului. Se actualizează în același PR cu orice schimbare importantă.

## 1. Starea produsului

Implementat:

- autentificare, sesiune și profil;
- profil public sau privat;
- galerie cu maximum 6 fotografii și fotografie principală;
- încărcare, înlocuire și ștergere în Firebase Storage;
- căutare, cereri de prietenie și listă de prieteni;
- propunerea, acceptarea și eliminarea unui manager;
- roluri exclusive de owner și manager;
- recomandări cu filtre de vârstă, gen și interese;
- like, dislike și creare automată a unei potriviri la like reciproc;
- lista potrivirilor;
- ecranul conversației în timp real pentru manageri, cu trimitere de mesaje;
- accesarea profilului potrivirii din chat și întoarcerea prin butonul X;
- blocarea și deblocarea conversației cu păstrarea istoricului;
- interfață în limba română pentru fluxurile principale;
- teste Jest și teste pentru regulile Firestore și Storage în Firebase Emulator.

Neimplementat încă:

- inițializarea automată și lista conversațiilor;
- notificări push;
- block/unblock și eliminarea unei potriviri.

## 2. Tehnologii

- Expo SDK 54 și React Native;
- TypeScript;
- Expo Router;
- Firebase Authentication;
- Cloud Firestore;
- Firebase Storage;
- Jest și React Native Testing Library;
- Firebase Emulator Suite și `@firebase/rules-unit-testing`.

Proiectul Firebase folosit este `setitup-84173`, iar bucket-ul Storage este `setitup-84173.firebasestorage.app`.

## 3. Pornirea și verificarea proiectului

Comenzile se rulează din folderul `client`:

```bash
cd client
npm install
npx expo start
```

Expo permite deschiderea aplicației pe iOS, Android și web.

Înainte de PR se rulează:

```bash
npm test -- --runInBand
npx tsc --noEmit
npm run lint
npm run test:firebase-rules
```

Testele regulilor necesită Java și pornesc local emulatoarele Firestore și Storage fără să modifice proiectul Firebase real. Se pot rula și separat:

```bash
npm run test:firestore-rules
npm run test:storage-rules
```

Testele locale nu confirmă faptul că regulile și indexurile au fost publicate. După schimbarea lor trebuie făcut deploy și trebuie testat manual fluxul cu mai multe conturi reale.

## 4. Arhitectura

```text
Interfață
   ↓ validează acțiunea
Serviciu
   ↓ citește sau scrie
Firebase Authentication / Firestore / Storage
   ↓ aplică regulile de securitate
Rezultat sau eroare
   ↓
Interfață actualizată
```

Responsabilități:

- ecranele gestionează interacțiunea și starea interfeței;
- componentele conțin elemente vizuale reutilizabile;
- serviciile conțin logica Firebase;
- contextele păstrează autentificarea și profilul curent;
- tipurile definesc contractele comune;
- regulile Firestore și Storage reprezintă securitatea reală.

Ecranele nu trebuie să implementeze direct o operație Firebase care există deja într-un serviciu.

## 5. Structura principală

```text
client/
├── app/
│   ├── (auth)/             autentificare și înregistrare
│   ├── profile/            creare, recuperare, vizualizare și editare profil
│   ├── friends/            prieteni, cereri, căutare și manager
│   ├── feed/               recomandări și filtre
│   ├── matches/            potriviri
│   └── users/[uid].tsx     profilul altui utilizator
├── components/             componente vizuale reutilizabile
├── contexts/               autentificarea și profilul curent
├── services/
│   ├── feed/               recomandări, reacții și potriviri
│   └── social/             căutare, cereri, prietenii și manager
├── types/                  tipuri TypeScript comune
├── utils/                  validări și mesaje de eroare
├── firestore-emulator/     teste pentru regulile Firestore
└── storage-emulator/       teste pentru regulile Storage

database/
├── firestore.rules
└── storage.rules
```

## 6. Rute și navigare

| Rută | Rol |
|---|---|
| `/login` | autentificare |
| `/register` | creare cont |
| `/profile/create` | completarea profilului |
| `/profile/recover` | recuperarea profilului lipsă |
| `/profile/view` | propriul profil |
| `/profile/edit` | editarea profilului și fotografiilor |
| `/friends` | lista și funcțiile de prietenie |
| `/friends/search` | căutare după username |
| `/friends/requests` | cereri primite și trimise |
| `/friends/manager` | gestionarea managerului |
| `/feed` | recomandările folosite de manager |
| `/feed/filters` | filtrele recomandărilor |
| `/matches` | lista potrivirilor |
| `/messages/{conversationId}` | chat-ul în timp real dintre managerii unei potriviri |
| `/users/{uid}` | profilul altui utilizator |

`app/_layout.tsx` protejează rutele:

- fără sesiune → `/login`;
- profil inexistent → `/profile/recover`;
- profil incomplet → `/profile/create`;
- profil complet care intră într-un flux de autentificare → `/profile/view`.

Navbarul principal conține `Profil`, `Prieteni`, `Recomandări` și `Potriviri`.

## 7. Profiluri și fotografii

Datele sunt separate astfel:

```text
Firebase Authentication
└── cont, UID, email, parolă securizată și sesiune

users/{uid}
└── profilul complet al proprietarului

usernames/{normalizedUsername}
└── asocierea username → UID

publicProfiles/{uid}
└── datele profilului folosite în funcțiile sociale

Firebase Storage
└── profilePhotos/{uid}/{photoId}.{extensie}
```

`users/{uid}` conține inclusiv emailul, data exactă a nașterii, acceptarea GDPR, `photoPaths`, `primaryPhotoPath` și `photoUrl`.

`publicProfiles/{uid}` nu conține emailul, data exactă a nașterii sau acceptarea GDPR. Conține vârsta calculată și datele necesare pentru profil, prieteni, recomandări și potriviri.

Un profil privat este ascuns din recomandări. Proprietarul și prietenii lui îl pot vedea în continuare; utilizatorii care nu sunt prieteni nu primesc profilul complet.

Regulile galeriei:

- fiecare profil poate avea cel mult 6 fotografii;
- prima fotografie încărcată devine principală dacă nu există alta;
- `primaryPhotoPath` trebuie să aparțină listei `photoPaths`;
- `photoUrl` păstrează URL-ul fotografiei principale pentru afișare rapidă;
- metadatele sunt sincronizate în `users` și `publicProfiles`;
- ștergerea fotografiei principale alege următoarea fotografie disponibilă;
- înlocuirea păstrează poziția fotografiei în galerie;
- după actualizarea Firestore, fișierul vechi este curățat din Storage;
- operațiile verifică starea profilului pentru a evita suprascrierile concurente.

Regulile Storage permit:

- citire numai utilizatorilor autentificați;
- încărcare, înlocuire și ștergere numai proprietarului folderului;
- numai fișiere JPEG, PNG și WebP;
- maximum 5 MB pentru fiecare fotografie;
- numai nume de fișier și căi conforme structurii aplicației.

## 8. Prieteni și manager

`friendRequests/{pairId}` păstrează o singură cerere activă între două UID-uri. La acceptare, cererea este ștearsă și se creează `friendships/{pairId}` în aceeași tranzacție.

`managerRequests` păstrează propunerile în așteptare, iar `managerRelationships/{ownerId}` relația acceptată.

`managerRoles/{uid}` blochează rolurile incompatibile:

```text
managerRoles/{uid}
├── uid
├── role: "owner" | "manager"
├── counterpartId
└── createdAt
```

Regulile produsului:

- un owner poate avea un singur manager;
- un manager poate gestiona un singur owner;
- aceeași persoană nu poate fi simultan owner și manager;
- propunerea este permisă numai între prieteni;
- persoana propusă trebuie să accepte;
- acceptarea și eliminarea actualizează atomic relația și rolurile.

## 9. Recomandări, reacții și potriviri

Numai managerul activ folosește recomandările și potrivirile în numele ownerului.

Un candidat este eligibil dacă:

- are profil public;
- are propriul manager activ;
- nu este ownerul sau managerul care folosește feedul;
- nu este prieten direct cu ownerul;
- nu este gestionat de același manager;
- nu este ascuns de o reacție activă;
- nu există deja o potrivire cu ownerul.

Ordinea recomandărilor este stabilă pentru pagina curentă și se schimbă la o reîmprospătare nouă. Lista urmărește aproximativ raportul 80/20: patru profiluri care respectă vârsta, genul și interesele sunt urmate de un profil eligibil care nu respectă toate filtrele. Dacă una dintre categorii nu are suficiente rezultate, lista este completată cu profilurile disponibile din cealaltă categorie, astfel încât feedul să nu rămână gol.

Apăsările repetate și cererile identice sunt consolidate pentru a evita rezultate duplicate sau răspunsuri vechi care suprascriu starea curentă.

`reactions/{ownerId_targetId}` păstrează direcția reacției. Like-ul rămâne ascuns până la reciprocitate. Un like reciproc creează tranzacțional un singur document `matches/{pairId}`. După dislike, profilul este ascuns până la expirarea reacției.

## 10. Colecțiile Firestore

| Colecție | Responsabilitate |
|---|---|
| `users` | profilul complet și privat |
| `usernames` | username unic și asocierea cu UID-ul |
| `publicProfiles` | date sociale sigure și metadatele fotografiilor |
| `friendRequests` | cereri de prietenie active |
| `friendships` | prietenii acceptate |
| `managerRequests` | propuneri de manager |
| `managerRelationships` | relații de manager acceptate |
| `managerRoles` | rolul exclusiv și persoana asociată |
| `preferences` | filtrele salvate pentru recomandări |
| `reactions` | like/dislike direcționat |
| `matches` | potriviri reciproce |
| `conversations` | conversațiile potrivirilor și starea lor de blocare |
| `conversations/{id}/messages` | mesajele în timp real dintre manageri |
| `blocks` | blocările active dintre participanții conversației |

ID-urile dintre două persoane sunt deterministe. Pentru relațiile fără direcție UID-urile sunt sortate; pentru reacții se păstrează ordinea owner → candidat.

## 11. Servicii principale

| Serviciu | Responsabilitate |
|---|---|
| `authService.ts` | cont, sesiune, login, logout și ștergere cont |
| `profileService.ts` | creare, citire și sincronizare profil |
| `photoStorageService.ts` | încărcare, înlocuire, ștergere și URL-uri Storage |
| `userSearchService.ts` | căutare și starea relației |
| `friendRequestSendService.ts` | crearea cererilor |
| `friendRequestInboxService.ts` | listare, acceptare, refuz și anulare |
| `friendshipService.ts` | listă, verificare și eliminare prieten |
| `managerService.ts` | cereri, relații și roluri de manager |
| `preferencesService.ts` | citirea, validarea și salvarea filtrelor |
| `feed/feedService.ts` | eligibilitate, filtrare, ordine și paginare |
| `feed/reactionService.ts` | like/dislike și detectarea reciprocității |
| `feed/matchService.ts` | listarea potrivirilor |

Tipurile comune sunt în `types/profile.ts`, `types/social.ts`, `types/feed.ts` și `types/photo.ts`. Nu se definesc copii locale ale acelorași contracte.

## 12. Securitate Firebase

Interfața nu este securitate. Ascunderea unui buton nu înlocuiește regulile Firestore sau Storage.

Regulile verifică, în funcție de operație:

- utilizatorul autentificat;
- proprietarul documentului sau fotografiei;
- participanții relației;
- rolul activ de manager;
- forma exactă a documentului și câmpurile permise;
- existența reacțiilor reciproce înainte de crearea unui match;
- limita și consistența metadatelor fotografiilor.

Fișierele sunt:

- `database/firestore.rules`;
- `database/storage.rules`;
- `client/database/firestore.indexes.json`.

Interogările compuse pot necesita indexuri. O eroare Firestore care oferă un link de creare a indexului nu trebuie mascată ca listă goală.

## 13. Testare manuală minimă

### Prietenie și manager

1. A trimite o cerere către B;
2. B acceptă și prietenia apare pentru amândoi;
3. A îl propune pe B ca manager;
4. B acceptă;
5. relația și cele două roluri sunt create;
6. eliminarea relației șterge și blocările de rol.

### Recomandări și potriviri

1. două perechi owner–manager sunt active;
2. managerul primei perechi vede ownerul celeilalte perechi;
3. profilurile private, prietenii și profilurile deja procesate sunt excluse;
4. când există suficiente rezultate, pagina respectă aproximativ raportul 80% compatibile și 20% din afara filtrelor;
5. dacă o categorie este goală, apar profilurile eligibile din cealaltă categorie;
6. două like-uri reciproce creează o singură potrivire;
7. potrivirea apare pentru managerii ambelor profile.

### Fotografii

1. proprietarul încarcă o fotografie acceptată sub 5 MB;
2. fotografia apare în profil, recomandări, prieteni și potriviri;
3. se pot încărca maximum 6 fotografii;
4. înlocuirea păstrează poziția și elimină fișierul vechi;
5. ștergerea fotografiei principale promovează următoarea fotografie;
6. alt utilizator nu poate modifica folderul proprietarului;
7. un tip neacceptat sau un fișier peste 5 MB este refuzat.

## 14. Convenții

- UID-ul Firebase este identitatea reală, nu username-ul;
- username-ul este normalizat cu `trim().toLowerCase()`;
- parola nu se salvează în Firestore;
- datele private nu se copiază în documente publice;
- fiecare operație Firebase are un serviciu responsabil;
- operațiile dependente folosesc tranzacții sau batch-uri când este posibil;
- toate citirile unei tranzacții se fac înaintea scrierilor;
- erorile nu se transformă în rezultate goale fără motiv explicit;
- acțiunile asincrone au loading, empty state și mesaj de eroare;
- butoanele sunt dezactivate cât timp acțiunea este în curs;
- nu se folosesc date simulate în versiunea finală;
- înainte de PR se rulează testele, TypeScript, lint și testele regulilor;
- după schimbarea regulilor sau indexurilor se confirmă publicarea în Firebase;
- README-ul se actualizează când se schimbă o rută, colecție, regulă de produs, limită, serviciu sau flux implementat.
