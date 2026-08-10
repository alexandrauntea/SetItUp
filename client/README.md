# SetItUp

Aplicație mobilă realizată cu Expo, React Native, TypeScript și Firebase.

## Pornirea proiectului

```bash
npm install
npx expo start
```

Din terminal poți deschide aplicația pe Android, iOS sau web.

## Verificări înainte de commit

```bash
npm test -- --runInBand
npx tsc --noEmit
npm run lint
```

## Structura principală

- `app/` — ecranele și navigarea Expo Router;
- `components/` — componente vizuale reutilizabile;
- `contexts/` — starea autentificării și a profilului;
- `services/` — comunicarea cu Firebase;
- `types/` — structurile TypeScript comune;
- `utils/` — validări și mesaje de eroare;
- directoarele `__tests__/` — testele automate.
