// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJuQkfgGsfQ7gXq7Xc53Kz1nH09tb9AVM",
  authDomain: "regnify.firebaseapp.com",
  projectId: "regnify",
  storageBucket: "regnify.firebasestorage.app",
  messagingSenderId: "1036668551135",
  appId: "1:1036668551135:web:b58105bb26b34fecfc0e6a",
  measurementId: "G-V211XPLSPM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const analytics = getAnalytics(app);