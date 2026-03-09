import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA6xOY5gUnJLEffuymwVYYfG6ljazeM_Bc",
  authDomain: "farmsassists.firebaseapp.com",
  projectId: "farmsassists",
  storageBucket: "farmsassists.firebasestorage.app",
  messagingSenderId: "703283032446",
  appId: "1:703283032446:web:51691bf8bf380a77b5832f",
  measurementId: "G-HPJFYJ69YZ"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { app, auth, googleProvider };

