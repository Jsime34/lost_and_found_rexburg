// firebase.js: connects the website to our Firebase project.
//
// Any page that needs the database or login imports what it needs from this file:
//
//   import { db, collection, getDocs } from "./js/firebase.js";
//
// That page's <script> tag must have type="module", or imports won't work:
//
//   <script type="module" src="script.js"></script>
//
// This config is NOT a secret: every Firebase website sends it to the browser.
// Our data is protected by the security rules (firestore.rules), not by hiding this.

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxzs_iz2LpzZl8E9TR6znWBKy8bbfEys4",
  authDomain: "rexburg-lost-and-found.firebaseapp.com",
  projectId: "rexburg-lost-and-found",
  storageBucket: "rexburg-lost-and-found.firebasestorage.app",
  messagingSenderId: "198522131659",
  appId: "1:198522131659:web:f3b9d6fe5440aa751db74e",
};

const app = initializeApp(firebaseConfig);

// Login (Firebase Authentication)
export const auth = getAuth(app);

// Database (Firestore)
export const db = getFirestore(app);

// The Firebase functions our pages use. Import them from this file instead of from
// gstatic.com, so every page uses the same Firebase version (mixing versions breaks things).
export {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

export {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
