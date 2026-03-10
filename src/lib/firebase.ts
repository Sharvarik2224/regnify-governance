import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDzqy0Wl6hg5oboVc8PlpSPTZUC1oTcQ3M",
  authDomain: "regnify-46948.firebaseapp.com",
  projectId: "regnify-46948",
  storageBucket: "regnify-46948.firebasestorage.app",
  messagingSenderId: "912618964061",
  appId: "1:912618964061:web:40229694b158fb2a8b39b4",
  measurementId: "G-REKMGTMGL0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : undefined;

export const actionCodeSettings = {
  url: "http://localhost:8080/finishSignUp",
  handleCodeInApp: true,
};

export async function sendEmailSignInLink(email: string) {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem("emailForSignIn", email);
}