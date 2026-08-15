# Sprint 3 — contract de integrare

Obiectivul Sprintului 3 este livrarea feedului, filtrelor, reacțiilor
like/dislike și match-urilor. Mesageria și block/unblock rămân pentru Sprintul 4.

## Decizii de produs

- ownerul desemnează un manager, dar nu folosește feedul și nu vede
  match-urile;
- numai managerul configurează filtrele și folosește feedul și match-urile în
  numele ownerului;
- un owner poate avea un singur manager;
- un manager poate gestiona un singur owner;
- o persoană nu poate fi simultan owner și manager;
- un utilizator fără manager activ nu este eligibil pentru feed;
- like-urile sunt secrete până la reciprocitate;
- like-ul reciproc creează automat un match și afișează confirmarea locală;
- notificările push nu fac parte deocamdată din Sprintul 3;
- eliminarea unui match și block/unblock rămân pentru Sprintul 4.

## Selecția feedului

Ordinea este aleatorie. Pentru fiecare pagină se urmărește aproximativ:

- 80% profiluri care respectă preferințele salvate;
- 20% profiluri aleatorii care pot să nu respecte preferințele.

Filtrele sunt deci preferințe, nu restricții obligatorii. Sunt configurate de
manager și salvate separat pentru owner.

Un candidat este eligibil numai dacă:

- are profil public;
- are propriul manager activ;
- nu este ownerul sau managerul care folosește feedul;
- nu este prieten direct cu ownerul;
- nu a fost deja apreciat și nu așteaptă reciprocitatea;
- nu este un match actual sau anterior;
- nu este gestionat de același manager.

Prietenii prietenilor nu au prioritate, dar cardul poate afișa numărul de
prieteni comuni atunci când există.

După dislike, candidatul este ascuns 30 de zile. La expirare, reacția se șterge
și candidatul poate reapărea. După like, candidatul rămâne ascuns cât timp se
așteaptă reciprocitatea. După match, candidatul nu mai reapare.

Acest document fixează contractele comune înainte ca funcționalitățile să fie
împărțite pe branch-uri. Orice schimbare a rutelor, tipurilor sau schemelor de
mai jos trebuie discutată înainte de implementare.

## Branch-uri și ordine

Toate branch-urile pornesc din `sprint3-integration`:

1. `feature/feed-data`;
2. `feature/feed-filters`;
3. `feature/feed-ui`;
4. `feature/reactions-matches`;
5. `feature/feed-security`.

Un branch se actualizează din `sprint3-integration` înainte de PR. PR-urile se
integrează în ordinea de mai sus, iar `main` se actualizează numai după testarea
completă a sprintului.

## Împărțirea echipei

### Andrei — fundația de roluri, feed data și integrare

Branch-uri:

- `feature/manager-role-lock`;
- `feature/feed-data`;
- `feature/feed-security`.

Responsabilități:

- implementează `managerRoles/{uid}` și migrează acceptarea/eliminarea
  relației de manager la operații atomice;
- blochează rolurile simultane și situația în care un manager gestionează mai
  mulți owneri;
- implementează selecția candidaților, excluderile, amestecarea 80/20 și
  paginarea din `feedService.ts`;
- coordonează regulile, indexurile, integrarea și publicarea Firebase;
- actualizează documentația arhitecturală finală.

Nu implementează interfața cardului, formularul filtrelor sau salvarea
reacțiilor.

### Alexandra — interfața feedului

Branch: `feature/feed-ui`.

Fișiere principale:

- `client/app/feed/index.tsx`;
- `client/components/feed/FeedProfileCard.tsx`;
- `client/components/feed/FeedActions.tsx`;
- `client/components/feed/FeedEmptyState.tsx`;
- testele componentelor și ecranului.

Responsabilități:

- afișează profilul curent, numărul prietenilor comuni și informațiile publice;
- gestionează loading, empty state, eroare, retry și dezactivarea acțiunilor;
- conectează butoanele la contractele serviciilor, fără acces Firebase direct;
- afișează confirmarea locală „Este match!” când serviciul întoarce un match;
- face interfața responsivă pe mobil și web.

Nu modifică tipurile comune, regulile Firestore sau algoritmul 80/20.

### Anca — filtrele și preferințele

Branch: `feature/feed-filters`.

Fișiere principale:

- `client/app/feed/filters.tsx`;
- `client/services/feed/feedPreferencesService.ts`;
- componente noi strict pentru filtre;
- testele filtrelor și serviciului.

Responsabilități:

- implementează intervalul de vârstă, genurile și interesele;
- validează intervalele și selecțiile;
- citește și salvează preferințele pentru ownerul gestionat;
- explică în interfață faptul că filtrele sunt preferințe și că pot apărea
  profiluri aleatorii;
- acoperă loading, salvare, eroare și valori implicite.

Nu filtrează local lista și nu modifică query-urile feedului.

### Ștefan — reacții și match-uri

Branch: `feature/reactions-matches`.

Fișiere principale:

- `client/services/feed/reactionService.ts`;
- `client/services/feed/matchService.ts`;
- `client/app/matches/index.tsx`;
- componente noi strict pentru lista match-urilor;
- testele serviciilor și ecranului.

Responsabilități:

- salvează idempotent like/dislike cu `reactionId` determinist;
- păstrează like-ul secret și detectează reciprocitatea tranzacțional;
- creează un singur match pentru aceeași pereche;
- aplică expirarea dislike-ului după 30 de zile;
- listează match-urile ownerului pentru manager și deschide profilul public;
- tratează duplicatele, erorile și apăsările repetate.

Nu implementează mesagerie, block/unblock sau notificări push.

## Fișiere comune protejate

Următoarele fișiere se modifică numai printr-un PR separat, discutat înainte:

- `client/types/feed.ts`;
- `client/types/social.ts`;
- `client/services/social/socialIds.ts`;
- `client/app/_layout.tsx`;
- `client/components/AppBottomNav.tsx`;
- `database/firestore.rules`;
- `client/database/firestore.indexes.json`;
- `SPRINT3.md`.

Fiecare responsabil poate propune o schimbare de contract, dar nu o include
ascuns într-un PR de funcționalitate.

## Ordinea de pornire

1. Andrei finalizează și integrează `feature/manager-role-lock`.
2. Echipa își actualizează branch-urile din `sprint3-integration`.
3. `feed-data`, `feed-filters` și `reactions-matches` pot continua în paralel.
4. `feed-ui` folosește mock-uri conforme contractelor până când serviciile sunt
   integrate.
5. `feed-security` se finalizează după stabilizarea operațiilor reale.
6. Se rulează integrarea cu trei conturi înainte de merge în `main`.

## Rute stabile

| Rută | Responsabilitate |
|---|---|
| `/feed` | lista de profiluri și acțiunile like/dislike |
| `/feed/filters` | preferințele feedului |
| `/matches` | lista match-urilor utilizatorului |

Navigarea globală se modifică numai pe `sprint3-integration`.

## Colecții Firestore planificate

```text
feedPreferences/{ownerId}
reactions/{ownerId_targetId}
matches/{pairId}
managerRoles/{uid}
```

- `ownerId` este persoana pentru care funcționează feedul;
- `actorId` este persoana care execută acțiunea;
- `actorRole` este `owner` sau `manager`;
- `reactionId` păstrează direcția reacției;
- `matchId` sortează cele două UID-uri și nu păstrează direcția.

`managerRoles/{uid}` este blocarea deterministă a rolului. La acceptarea unei
relații se creează atomic câte un document pentru owner și manager. Astfel,
regulile Firestore pot împiedica un manager să gestioneze mai mulți owneri și o
persoană să fie simultan owner și manager. La eliminarea relației se șterg
relația și ambele documente de rol în aceeași operație.

```text
managerRoles/{uid}
├── uid
├── role: "owner" | "manager"
├── counterpartId
└── createdAt
```

Formele TypeScript canonice sunt în `client/types/feed.ts`. Nu se definesc copii
locale în ecrane, componente sau servicii.

## Limitele modulelor

- `feedService.ts` citește candidații eligibili și paginarea;
- `feedPreferencesService.ts` citește și salvează filtrele;
- `reactionService.ts` salvează o reacție și poate întoarce match-ul rezultat;
- `matchService.ts` listează match-urile;
- ecranele nu accesează Firebase direct;
- regulile Firestore sunt autoritatea pentru accesul ownerului și managerului.

Serviciile conțin deocamdată doar contractele de tip. Fiecare implementare va
înlocui contractul din fișierul pe care îl deține, fără să schimbe tipurile
comune unilateral.

## Criterii de integrare

Fiecare PR trebuie să includă testele modulului și să treacă:

```bash
npm test -- --runInBand
npx tsc --noEmit
npm run lint
```

PR-urile care modifică reguli sau indexuri trebuie să treacă și
`npm run test:firestore-rules`. La final, fluxul se verifică manual cu trei
conturi: owner, manager și profil candidat.
