// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlr3mmp4iqOLDX-MNIefpnVRltTge_eGo",
  authDomain: "zero-classes.firebaseapp.com",
  databaseURL: "https://zero-classes-default-rtdb.firebaseio.com",
  projectId: "zero-classes",
  storageBucket: "zero-classes.firebasestorage.app",
  messagingSenderId: "50176024096",
  appId: "1:50176024096:web:69640036fa770ad0972645",
  measurementId: "G-PCX8DPPL3H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);