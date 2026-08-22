# SetItUp

SetItUp is a social application where trusted friends can discover and connect
compatible people on behalf of the users they manage.

The application is built with Expo, React Native, TypeScript, and Firebase and
can run on iOS, Android, and the web.

## About the project

SetItUp was created as a team project during the **VOIS Summer School of
Engineering**.

The project followed a role-rotation approach, giving team members practical
experience across different parts of the software delivery process, including:

- software development;
- design and architecture;
- quality assurance;
- DevOps and Agile practices;
- cybersecurity;
- artificial intelligence.

Working in rotating roles helped us understand how a product evolves from an
initial idea to a working application. We collaborated on product decisions,
designed the user experience, implemented and reviewed features, tested the
application, worked with Firebase services and security rules, and prepared the
project for delivery and presentation.

## Features

- authentication and profile creation;
- public and private profiles with photo galleries;
- friend search, requests, and friend management;
- assigning a trusted friend as a manager;
- recommendations filtered by age, gender, and interests;
- like and dislike reactions;
- automatic matches after a mutual like;
- real-time conversations for assigned managers;
- blocking and unblocking conversations;
- responsive interfaces for mobile and web.

## Technology

- [Expo](https://expo.dev/) and React Native;
- TypeScript;
- Expo Router;
- Firebase Authentication;
- Cloud Firestore;
- Firebase Storage;
- Jest and React Native Testing Library.

## Run locally

Node.js and npm are required.

```bash
git clone https://github.com/alexandrauntea/SetItUp.git
cd SetItUp/client
npm install
npm start
```

From the Expo menu, the application can be opened in an iOS simulator, an
Android emulator, or a web browser.

Alternative commands:

```bash
npm run ios
npm run android
npm run web
```

## Project checks

Run these commands from the `client` directory:

```bash
npm test -- --runInBand
npm run lint
npx tsc --noEmit
```

Java is also required to test the Firebase security rules:

```bash
npm run test:firebase-rules
```

## Project structure

```text
SetItUp/
├── client/       Expo application and tests
├── database/     Firestore and Storage security rules
├── scripts/      Firebase administration tools
├── firebase.json
└── README.md
```

Instructions for cleaning test data and using the administrative scripts are
available in [scripts/README.md](scripts/README.md).

## Team

Developed collaboratively during the VOIS Summer School of Engineering.
