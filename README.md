# SetItUp — ghidul proiectului

Acest document explică scopul, structura și regulile aplicației SetItUp. El trebuie actualizat atunci când se adaugă un flux, o rută, o colecție Firestore sau o regulă importantă de produs.

## 1. Ce este SetItUp

SetItUp este o aplicație mobilă socială în care un utilizator își creează un profil, își adaugă prieteni și poate desemna un prieten de încredere drept manager. În sprinturile următoare, managerul va putea folosi feedul și mesageria în numele proprietarului profilului.

Planul MVP este:

1. autentificare și profil;
2. prieteni și manager;
3. feed, like/dislike și match;
4. conversații, mesaje și block/unblock.

În versiunea curentă sunt implementate autentificarea, profilul și funcționalitățile planificate pentru Sprintul 2. Închiderea sprintului mai necesită validarea manuală a fluxurilor sociale cu două conturi reale. Feedul și mesageria nu sunt încă implementate.

## 2. Tehnologii

- Expo SDK 54 și React Native pentru aplicația mobilă;
- TypeScript pentru verificarea tipurilor;
- Expo Router pentru navigarea bazată pe fișiere;
- Firebase Authentication pentru conturi și sesiuni;
- Cloud Firestore pentru profiluri și relații sociale;
- Firebase Storage pentru fotografia de profil, dacă serviciul este disponibil;
- Jest și React Native Testing Library pentru teste.

## 3. Pornirea proiectului

Toate comenzile de mai jos se rulează din folderul `client`:

```bash
cd client
npm install
npx expo start
```

Din terminalul Expo se poate deschide aplicația pe iOS, Android sau web.

Înainte de commit se rulează obligatoriu:

```bash
npm test -- --runInBand
npx tsc --noEmit
npm run lint
npm run test:firestore-rules
```

Ultima comandă pornește automat un Firestore Emulator local și testează regulile fără să atingă proiectul Firebase real. Necesită Java; Java 21 sau mai nou este recomandat pentru versiunile viitoare Firebase CLI. Verificările locale nu demonstrează că regulile și indexurile sunt publicate în Firebase, deci fluxurile sociale trebuie testate și manual cu cel puțin două conturi.

## 4. Arhitectura pe scurt

Fluxul obișnuit este:

```text
Utilizatorul apasă un buton
            ↓
Ecranul validează acțiunea și apelează un serviciu
            ↓
Serviciul citește sau scrie în Firebase
            ↓
Regulile Firestore permit sau refuză operația
            ↓
Serviciul întoarce rezultatul sau eroarea
            ↓
Ecranul își actualizează starea și interfața
```

Responsabilitățile trebuie păstrate separate:

- ecranele afișează date și gestionează interacțiunea;
- componentele oferă elemente vizuale reutilizabile;
- serviciile conțin logica Firebase;
- contextele păstrează date globale;
- tipurile definesc forma comună a datelor;
- regulile Firestore reprezintă securitatea reală.

Un ecran nu ar trebui să implementeze o a doua versiune a unei operații care există deja într-un serviciu.

## 5. Structura folderelor

```text
client/
├── app/                    ecrane și rute Expo Router
│   ├── (auth)/             login și înregistrare
│   ├── profile/            creare, recuperare, vizualizare și editare profil
│   ├── friends/            listă, căutare, cereri și manager
│   └── users/[uid].tsx     profilul public al altui utilizator
├── components/             componente vizuale reutilizabile
│   └── social/             carduri pentru funcțiile sociale
├── constants/              culori și opțiuni comune
├── contexts/               autentificarea și profilul curent
├── services/               acces la Firebase și logica aplicației
│   └── social/             căutare, cereri, prietenii și manager
├── types/                  tipuri TypeScript comune
├── utils/                  validări și mesaje de eroare
└── **/__tests__/           teste automate

database/
├── firestore.rules         reguli de securitate Firestore
└── storage.rules           reguli pentru fișiere
```

## 6. Rute și navigare

Expo Router transformă structura din `app` în rute:

| Fișier | Rută | Rol |
|---|---|---|
| `app/(auth)/login.tsx` | `/login` | autentificare |
| `app/(auth)/register.tsx` | `/register` | creare cont |
| `app/profile/create.tsx` | `/profile/create` | completare profil |
| `app/profile/recover.tsx` | `/profile/recover` | recuperarea profilului lipsă |
| `app/profile/view.tsx` | `/profile/view` | propriul profil |
| `app/profile/edit.tsx` | `/profile/edit` | editare profil |
| `app/friends/index.tsx` | `/friends` | lista și centrul Friends |
| `app/friends/search.tsx` | `/friends/search` | căutare după username |
| `app/friends/requests.tsx` | `/friends/requests` | cereri primite/trimise |
| `app/friends/manager.tsx` | `/friends/manager` | gestionarea managerului |
| `app/users/[uid].tsx` | `/users/{uid}` | profil public dinamic |

`app/_layout.tsx` protejează rutele:

- fără utilizator autentificat → `/login`;
- cont fără document de profil → `/profile/recover`;
- profil incomplet → `/profile/create`;
- profil complet → `/profile/view`.

`AppBottomNav` afișează secțiunile `Profile` și `Friends`. Funcționalitățile sociale trebuie să rămână în secțiunea Friends, nu în pagina profilului.

## 7. Authentication, profil și contexte

Firebase Authentication păstrează UID-ul, emailul, parola securizată și sesiunea. Parola nu este salvată în Firestore și nu poate fi citită de aplicație.

`AuthContext` oferă întregii aplicații:

- utilizatorul autentificat;
- starea de încărcare;
- informația dacă există o sesiune.

`ProfileContext` oferă:

- profilul complet al utilizatorului curent;
- starea profilului (`ready`, `missing`, `error` etc.);
- încărcarea, reîmprospătarea și actualizarea profilului.

Nu se creează alte contexte pentru aceleași date.

## 8. De ce un utilizator apare în mai multe locuri

La înregistrare și completarea profilului sunt implicate mai multe surse:

```text
Firebase Authentication
└── cont, UID, email și parolă securizată

users/{uid}
└── profil complet și privat

usernames/{username}
└── legătura username → UID

publicProfiles/{uid}
└── informațiile care pot fi afișate altor utilizatori
```

Separarea permite căutare rapidă fără expunerea datelor private.

## 9. Colecțiile Firestore

Firestore este organizat în colecții și documente. O colecție este asemănătoare unui tabel, iar documentul este o înregistrare. O colecție goală nu apare în Firebase Console.

### `users/{uid}`

Profilul privat al proprietarului:

- UID și username;
- email și data exactă a nașterii;
- nume, ocupație, gen și descriere;
- interese și vizibilitate;
- acceptarea GDPR;
- starea completării profilului;
- fotografia și datele de creare/actualizare.

Documentul trebuie citit și modificat numai de proprietar.

### `usernames/{normalizedUsername}`

Registrul username-urilor unice. ID-ul documentului este username-ul normalizat cu `trim().toLowerCase()`.

```text
usernames/andrei
└── uid: UID_ANDREI
```

Este folosit pentru verificarea unicității și căutarea exactă. Nu trebuie să conțină email sau alte date private.

### `publicProfiles/{uid}`

Varianta sigură a profilului:

- username;
- nume și prenume;
- vârstă calculată, nu data nașterii;
- ocupație, gen, descriere și interese;
- vizibilitate și fotografie.

Nu conține email, data exactă a nașterii sau acceptarea GDPR. Dacă profilul este privat, alt utilizator vede doar informația minimă obținută din `usernames`.

### `friendRequests/{pairId}`

Conține numai cereri active cu status `pending`:

```text
friendRequests/UID_A_UID_B
├── senderId
├── senderUsername
├── receiverId
├── receiverUsername
├── memberIds
├── status: "pending"
├── createdAt
└── updatedAt
```

La acceptare, cererea este ștearsă și se creează o prietenie. La refuz sau anulare este doar ștearsă.

### `friendships/{pairId}`

Reprezintă o prietenie acceptată:

```text
friendships/UID_A_UID_B
├── memberIds
├── memberUsernames
└── createdAt
```

Username-urile sunt păstrate pentru ca lista să poată afișa și un prieten cu profil privat.

### `managerRequests/{ownerId}`

O propunere de manager în așteptare:

- `ownerId` — persoana care oferă acces la viitorul său feed și mesagerie;
- `managerId` — prietenul propus;
- username-urile și UID-urile celor doi;
- statusul `pending` și datele operației.

Numai un prieten poate fi propus, iar persoana propusă trebuie să accepte.
ID-ul este UID-ul ownerului, astfel încât fiecare profil poate avea maximum o
singură propunere de manager activă.

### `managerRelationships/{ownerId}`

Relația de manager acceptată. ID-ul documentului este UID-ul ownerului, ceea ce garantează maximum un manager activ pentru fiecare owner în MVP.

```text
managerRelationships/UID_OWNER
├── ownerId
├── ownerUsername
├── managerId
├── managerUsername
├── memberIds
└── createdAt
```

## 10. Identificatori deterministici

`createPairId(uidA, uidB)` sortează UID-urile și le unește:

```ts
[uidA, uidB].sort().join("_")
```

Astfel, A→B și B→A produc același ID. Între două persoane poate exista o singură cerere activă și o singură prietenie.

`createManagerRequestId(ownerId)` folosește UID-ul ownerului și împiedică
existența simultană a mai multor propuneri de manager pentru același profil.

Aceste funcții sunt singurele surse pentru ID-urile sociale și nu trebuie duplicate în ecrane sau alte servicii.

## 11. Fluxurile Sprintului 2

### Căutare și trimitere

1. utilizatorul introduce username-ul exact;
2. `findUserByUsername(username, currentUid)` citește `usernames/{username}`;
3. aplicația încearcă să citească profilul public;
4. verifică prietenia și cererea existentă folosind `pairId`;
5. rezultatul primește starea `none`, `request-sent`, `request-received` sau `friends`;
6. `sendFriendRequest` verifică self-request, prietenia și duplicatele;
7. cererea este salvată în `friendRequests/{pairId}`.

Un `permission-denied` la citirea profilului public înseamnă profil privat. O eroare de rețea trebuie tratată ca eroare, nu ca profil privat.

### Cereri primite și trimise

1. inboxul încarcă separat cererile după `receiverId` și `senderId`;
2. numai receiverul poate accepta sau refuza;
3. numai senderul poate anula;
4. acceptarea rulează într-o tranzacție;
5. tranzacția creează `friendships/{pairId}` și șterge cererea.

Tranzacția înseamnă că ori reușesc ambele operații, ori nu se aplică niciuna.

### Lista de prieteni

1. se caută documentele `friendships` în care `memberIds` conține UID-ul curent;
2. se identifică celălalt membru;
3. se afișează username-ul și inițialele;
4. utilizatorul poate deschide profilul permis sau elimina prietenia;
5. eliminarea prieteniei curăță și cererile/relațiile de manager dintre cei doi.

### Manager

1. ownerul alege un prieten;
2. se creează `managerRequests/{ownerId}`;
3. persoana propusă acceptă sau refuză;
4. ID-ul cererii permite maximum o propunere activă pentru fiecare owner;
5. acceptarea creează tranzacțional `managerRelationships/{ownerId}` și șterge cererea;
6. managerul vede toate profilurile pe care le gestionează;
7. `isManagerForUser(managerId, ownerId)` va controla accesul la feed și mesagerie în sprinturile următoare;
8. oricare participant poate elimina relația.

## 12. Serviciile și funcțiile lor

| Serviciu | Responsabilitate |
|---|---|
| `authService.ts` | register, login, logout, ștergerea contului și observarea sesiunii |
| `profileService.ts` | creare, citire, actualizare și sincronizare profil social |
| `profileImageService.ts` | încărcarea fotografiei |
| `userSearchService.ts` | căutare exactă, profil public și starea relației |
| `friendRequestSendService.ts` | validare și creare cerere |
| `friendRequestInboxService.ts` | listare, acceptare, refuz și anulare |
| `friendshipService.ts` | listă, verificare și eliminare prieten |
| `managerService.ts` | propuneri, acceptare, relație activă și eliminare manager |

Tipurile sociale sunt definite o singură dată în `types/social.ts` și nu trebuie redefinite local.

## 13. Starea interfeței

Ecranele asincrone folosesc de regulă:

- `isLoading` pentru prima încărcare;
- `isRefreshing` pentru pull-to-refresh;
- `isSubmitting`, `isSending` sau un ID de procesare pentru acțiuni;
- `errorMessage` pentru probleme;
- o variabilă precum `result`, `friends` sau `requests` pentru date.

În timpul unei acțiuni, butonul trebuie dezactivat pentru a preveni apăsările duplicate. O eroare Firebase nu trebuie mascată ca listă goală sau profil privat, exceptând cazurile intenționate și documentate.

## 14. Regulile Firestore și indexurile

Interfața nu este securitate. Chiar dacă un buton este ascuns, regulile Firestore trebuie să verifice UID-ul autentificat, rolul participantului și câmpurile scrise.

Exemple de reguli de produs:

- numai ownerul citește `users/{uid}`;
- numai senderul creează o cerere;
- numai receiverul o acceptă/refuză;
- numai participanții văd cererea sau prietenia;
- numai prietenii pot începe o relație de manager;
- persoana propusă trebuie să accepte.

Regulile se află în `database/firestore.rules`, iar indexurile în `client/database/firestore.indexes.json`. Faptul că fișierele există local nu înseamnă că sunt publicate.

Interogările compuse, precum:

```text
receiverId == UID
status == pending
orderBy createdAt desc
```

au nevoie de indexuri Firestore. Dacă un index lipsește, consola aplicației afișează de obicei o eroare cu un link de creare.

## 15. Testare

Testele Jest obișnuite folosesc Firebase simulat și verifică logica fără să modifice baza reală. Testele din `client/firestore-emulator` folosesc pachetul oficial `@firebase/rules-unit-testing` și regulile reale din `database/firestore.rules` într-un proiect local `demo-setitup`.

```bash
cd client
npm run test:firestore-rules
```

Comanda pornește emulatorul, rulează testele și îl oprește automat. Testele trebuie să acopere:

- rezultate normale;
- input invalid;
- lipsa documentelor;
- acces nepermis;
- duplicate și acțiuni proprii;
- erori Firebase/network;
- tranzițiile importante de stare.

Testarea manuală minimă pentru prietenie:

1. A îl caută pe B;
2. A trimite cererea;
3. documentul apare în `friendRequests`;
4. A îl vede la „Trimise”, B la „Primite”;
5. B acceptă;
6. cererea dispare;
7. documentul apare în `friendships`;
8. A și B apar în liste;
9. o nouă cerere este blocată;
10. eliminarea prieteniei o șterge pentru amândoi.

Testarea minimă pentru manager:

1. A și B sunt prieteni;
2. A îl propune pe B;
3. B vede și acceptă cererea;
4. apare `managerRelationships/{UID_A}`;
5. `isManagerForUser(UID_B, UID_A)` întoarce `true`;
6. A sau B elimină relația;
7. verificarea întoarce `false`.

## 16. Convenții pentru consistență

- rutele și numele funcțiilor comune se schimbă numai după acordul echipei;
- username-ul este normalizat și nu se schimbă în MVP;
- UID-ul Firebase este identitatea reală, nu username-ul;
- datele private nu se copiază în documente publice/sociale;
- nu se accesează direct profilul privat al altui utilizator;
- fiecare operație Firebase are un singur serviciu responsabil;
- operațiile dependente se fac tranzacțional sau într-un batch când este posibil;
- erorile nu se transformă în rezultate goale fără motiv explicit;
- nu se folosesc date simulate în versiunea finală;
- orice funcționalitate are loading, empty state și mesaj de eroare;
- înainte de PR se rulează testele, TypeScript și lint;
- după schimbarea regulilor/indexurilor se confirmă publicarea în Firebase;
- README-ul se actualizează în același PR cu schimbarea arhitecturală.

## 17. Starea actuală și pașii următori

Implementat:

- cont, login, logout și persistență;
- creare, recuperare, vizualizare și editare profil;
- profil public/privat;
- căutare exactă și profil public;
- trimitere, acceptare, refuz și anulare cereri;
- listă și eliminare prieteni;
- o singură propunere activă de manager pentru fiecare profil;
- acceptare tranzacțională și eliminare manager;
- lista profilurilor pentru care utilizatorul este manager;
- username-uri sociale disponibile și pentru profilurile private;
- interfață socială în limba română și navbar Profil/Prieteni;
- tratarea erorilor recuperabile fără ecranul roșu de dezvoltare.

Verificat automat:

- testele aplicației, verificarea TypeScript și lint trec;
- regulile Firestore acoperă profilurile, prieteniile, cererile și relațiile de manager;
- erorile serviciului manager sunt afișate explicit, nu transformate în liste goale;
- regulile și indexurile au fost publicate cu succes în proiectul Firebase `setitup-84173` pe 15 august 2026.

De verificat înainte de închiderea Sprintului 2:

- fluxul complet de prietenie funcționează cu două conturi reale;
- după acceptare, prietenia apare pentru ambele conturi;
- fluxul complet de manager funcționează după acceptarea prieteniei;
- relația și lista profilurilor gestionate rămân corecte după închiderea și redeschiderea aplicației.

Sprinturile următoare vor adăuga feedul, like/dislike, match, filtre, conversații, mesaje și block/unblock. Aceste funcții trebuie să folosească relația `managerRelationships/{ownerId}` pentru autorizarea managerului și să păstreze separarea dintre owner, manager și persoana din feed.

## 18. Cum actualizăm acest document

README-ul se actualizează când:

- apare sau dispare o rută;
- se adaugă o colecție ori se schimbă forma documentului;
- se schimbă o regulă funcțională;
- se introduce un serviciu sau un context;
- un flux trece din „planificat” în „implementat”;
- se descoperă o limitare importantă.

La fiecare actualizare trebuie verificat că descrierea corespunde codului existent. Documentul nu trebuie să promită funcții care nu sunt încă implementate.
