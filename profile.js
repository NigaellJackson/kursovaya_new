import { auth, db } from './firebase-config.js';
import { collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const keysGrid = document.getElementById('keys-list');

async function loadUserKeys(user) {
    try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "keys"));
        
        if (querySnapshot.empty) {
            keysGrid.innerHTML = '<p class="empty-msg">У вас пока нет купленных ключей.</p>';
            return;
        }

        keysGrid.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = 'key-card';
            div.innerHTML = `
                <button class="delete-key-btn" onclick="deleteKey('${docSnap.id}', this)">×</button>
                <h3>${data.itemName}</h3>
                <span class="key-value">${data.key}</span>
                <span class="key-date">Дата: ${data.date}</span>
            `;
            keysGrid.appendChild(div);
        });
    } catch (e) {
        console.error(e);
        keysGrid.innerHTML = '<p class="empty-msg">Ошибка загрузки ключей.</p>';
    }
}

window.deleteKey = async (keyId, btn) => {
    const user = auth.currentUser;
    if (!user || !confirm("Скрыть этот ключ из истории?")) return;

    try {
        const card = btn.closest('.key-card');
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';

        await deleteDoc(doc(db, "users", user.uid, "keys", keyId));
        card.remove();
        
        if (keysGrid.children.length === 0) {
            keysGrid.innerHTML = '<p class="empty-msg">У вас пока нет купленных ключей.</p>';
        }
    } catch (e) {
        alert("Ошибка удаления");
    }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserKeys(user);
    }
});

const menu = document.getElementById('mobile-menu');
const navList = document.getElementById('nav-list');
if (menu && navList) {
    menu.onclick = () => {
        menu.classList.toggle('active');
        navList.classList.toggle('active');
        document.body.style.overflow = navList.classList.contains('active') ? 'hidden' : 'auto';
    };
}

document.getElementById('logout-btn-profile')?.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'auth.html';
    });
});