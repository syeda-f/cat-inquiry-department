# 🐱 Cat Inquiry Department

Cat Inquiry Department is a fun detective game where players solve mystery cases involving cats. Players collect clues, investigate suspects, and solve each case using logic and observation.

The project was built with React, TypeScript, Vite, and Firebase.

## Features

* Solve cat mystery cases
* View case files and evidence
* Investigate different suspects
* Save player progress
* Sign in anonymously with Firebase
* Store game data in Firestore
* Responsive design for desktop and mobile

## Technologies Used

* React
* TypeScript
* Vite
* Firebase Authentication
* Cloud Firestore
* Tailwind CSS

## Getting Started

### Clone the repository

```bash
git clone https://github.com/syeda-f/cat-inquiry-department.git
cd cat-inquiry-department
```

### Install dependencies

```bash
npm install
```

### Set up Firebase

Create a file called `.env.local` in the project folder and add your Firebase configuration.

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

### Run the project

```bash
npm run dev
```

Open your browser and go to:

```
http://localhost:5173
```

### Build the project

```bash
npm run build
```

## Project Structure

```text
src/
public/
package.json
vite.config.ts
```

## Future Improvements

* Add more mystery cases
* Add achievements
* Improve animations
* Add sound settings
* Add a leaderboard


