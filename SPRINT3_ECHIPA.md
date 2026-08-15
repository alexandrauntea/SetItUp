# SetItUp — împărțirea muncii pentru Sprintul 3

## Obiectiv

În Sprintul 3 implementăm feedul folosit de manager în numele ownerului,
filtrele, like/dislike și match-urile. Mesageria, unmatch și block/unblock rămân
pentru Sprintul 4.

## Reguli funcționale

- Ownerul doar desemnează managerul.
- Numai managerul folosește Feed și Match-uri.
- Un owner poate avea un singur manager.
- Un manager poate gestiona un singur owner.
- O persoană nu poate fi simultan owner și manager.
- În feed apar numai profiluri publice care au manager activ.
- Feedul conține aproximativ 80% profiluri conforme preferințelor și 20%
  profiluri aleatorii.
- Se exclud ownerul, managerul, prietenii ownerului, profilurile deja apreciate și
  match-urile actuale sau anterioare.
- Like-ul este secret până când devine reciproc.
- Un like reciproc creează automat un match.
- După dislike, profilul poate reapărea după 30 de zile.

## Andrei — roluri, feed data, securitate și integrare

Branch-uri:

```text
feature/manager-role-lock
feature/feed-data
feature/feed-security
```

Taskuri:

- implementează regula un owner — un manager și rolurile exclusive;
- implementează selecția profilurilor, excluderile și raportul 80/20;
- implementează paginarea feedului;
- scrie regulile și indexurile Firestore;
- integrează branch-urile și publică schimbările Firebase;
- actualizează documentația finală.

## Alexandra — interfața feedului

Branch:

```text
feature/feed-ui
```

Taskuri:

- implementează ecranul principal Feed;
- finalizează cardul profilului și butoanele like/dislike;
- afișează numărul prietenilor comuni;
- adaugă loading, empty state, eroare și retry;
- afișează mesajul „Este match!”;
- scrie testele componentelor și ecranului;
- verifică interfața pe mobil și web.

Ecranul nu trebuie să acceseze Firebase direct.

## Anca — filtre și preferințe

Branch:

```text
feature/feed-filters
```

Taskuri:

- implementează filtrarea după vârstă, gen și interese;
- validează valorile introduse;
- citește și salvează preferințele pentru owner;
- explică în interfață faptul că pot apărea și profiluri aleatorii;
- adaugă loading, salvare și tratarea erorilor;
- scrie testele ecranului și serviciului.

Filtrarea listei nu se implementează local în ecran.

## Ștefan — reacții și match-uri

Branch:

```text
feature/reactions-matches
```

Taskuri:

- implementează salvarea like/dislike fără duplicate;
- păstrează like-urile secrete;
- detectează like-ul reciproc și creează un singur match;
- implementează expirarea dislike-ului după 30 de zile;
- implementează lista Match-uri și deschiderea profilului public;
- tratează erorile și apăsările repetate;
- scrie testele serviciilor și ecranului.

Mesageria, notificările push și block/unblock nu fac parte din acest task.

## Ordinea de lucru

1. Andrei integrează `feature/manager-role-lock`.
2. Toți își creează branch-ul din `sprint3-integration` actualizat.
3. Feed data, filtrele și reacțiile pot fi dezvoltate în paralel.
4. Feed UI folosește contractele și mock-uri până la integrarea serviciilor.
5. Securitatea se finalizează după implementarea operațiilor reale.
6. La final testăm fluxul cu minimum trei conturi.

## Reguli pentru PR-uri

- Nu se lucrează direct pe `main` sau `sprint3-integration`.
- Nu se accesează Firebase direct din ecrane.
- Tipurile comune și rutele nu se schimbă fără discuție.
- Fiecare PR include teste pentru funcționalitatea adăugată.
- Înainte de PR se rulează testele, TypeScript și lint.
- Branch-ul se actualizează din `sprint3-integration` înainte de integrare.
