import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDnatStYZZdvV1haTYoybMxwvUT9PorBs",
  authDomain: "kursovaya00.firebaseapp.com",
  projectId: "kursovaya00",
  storageBucket: "kursovaya00.firebasestorage.app",
  messagingSenderId: "535063013946",
  appId: "1:535063013946:web:ee84d4d01ecdecc5082303",
  measurementId: "G-Z9JJVFQPS3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const resetPassword = () => {
    const email = document.getElementById('email').value;
    if (!email) {
        alert("Введите почту для сброса пароля!");
        return;
    }
    sendPasswordResetEmail(auth, email)
        .then(() => alert("Ссылка для сброса отправлена на почту!"))
        .catch((err) => alert("Ошибка: " + err.message));
};