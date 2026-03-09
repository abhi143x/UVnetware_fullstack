// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBrcATReEFQs5mhqOoW4soL1oSoC3YgpjE",
  authDomain: "uvnetware-c7a4a.firebaseapp.com",
  projectId: "uvnetware-c7a4a",
  storageBucket: "uvnetware-c7a4a.firebasestorage.app",
  messagingSenderId: "656452988467",
  appId: "1:656452988467:web:6278b126c2d3d4fe93fd46",
  measurementId: "G-633KL6R293",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
