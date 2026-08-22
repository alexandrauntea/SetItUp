# SetItUp

SetItUp este o aplicație socială mobilă în care prietenii de încredere pot
descoperi și conecta persoane compatibile în numele utilizatorilor pe care îi
gestionează.

Aplicația este construită cu Expo, React Native, TypeScript și Firebase și poate
rula pe iOS, Android și web.

## Funcționalități

- autentificare și creare de profil;
- profil public sau privat și galerie foto;
- căutare, cereri și gestionare de prieteni;
- desemnarea unui prieten drept manager;
- recomandări filtrate după vârstă, gen și interese;
- reacții de tip like și dislike;
- creare automată a potrivirilor la like reciproc;
- conversații în timp real pentru managerii desemnați;
- blocarea și deblocarea conversațiilor;
- interfață adaptată pentru mobil și web.

## Tehnologii

- [Expo](https://expo.dev/) și React Native;
- TypeScript;
- Expo Router;
- Firebase Authentication;
- Cloud Firestore;
- Firebase Storage;
- Jest și React Native Testing Library.

## Pornire locală

Ai nevoie de Node.js și npm instalate.

```bash
git clone https://github.com/alexandrauntea/SetItUp.git
cd SetItUp/client
npm install
npm start
```

Din meniul Expo poți deschide aplicația pe un simulator iOS, emulator Android
sau în browser.

Comenzi alternative:

```bash
npm run ios
npm run android
npm run web
```

## Verificarea proiectului

Din folderul `client`:

```bash
npm test -- --runInBand
npm run lint
npx tsc --noEmit
```

Pentru testarea regulilor Firebase este necesar și Java:

```bash
npm run test:firebase-rules
```

## Structura proiectului

```text
SetItUp/
├── client/       aplicația Expo și testele
├── database/     regulile Firestore și Storage
├── scripts/      instrumente administrative Firebase
├── firebase.json
└── README.md
```

Instrucțiunile pentru curățarea datelor de test și folosirea scripturilor
administrative se găsesc în [scripts/README.md](scripts/README.md).

## Echipa

Proiect dezvoltat în cadrul echipei SetItUp.
