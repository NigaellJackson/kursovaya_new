import { auth, db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let cart = JSON.parse(localStorage.getItem('softCart')) || [];

window.addToCart = (btn) => {
    const card = btn.closest('.product-card');
    const title = card.getAttribute('data-title');
    const price = parseInt(card.getAttribute('data-price'));
    cart.push({ name: title, cost: price });
    localStorage.setItem('softCart', JSON.stringify(cart));
    updateUI();
    showToast("Добавлено: " + title);
};

window.clearCart = function() {
    cart = [];
    localStorage.removeItem('softCart');
    updateUI();
    showToast("Корзина очищена");
};

window.submitSupport = function(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const text = form.querySelector('textarea').value;
    const inbox = document.getElementById('support-inbox');
    const messagesList = document.getElementById('messages-list');
    const date = new Date().toLocaleString();

    emailjs.send('service_6asvew4', 'template_v0k0djm', {
        from_name: name,
        reply_to: email,
        message: text
    }).then(() => {
        showToast("Запрос отправлен на почту!");
    }).catch((err) => {
        console.error("EmailJS Error:", err);
        showToast("Ошибка отправки");
    });

    const messageHTML = `
        <div class="message-item">
            <div class="message-header">
                <span>Отправитель: ${name} (${email})</span>
                <span>${date}</span>
            </div>
            <div class="message-text">${text}</div>
        </div>
    `;

    if (inbox && messagesList) {
        inbox.classList.remove('auth-hidden');
        messagesList.insertAdjacentHTML('afterbegin', messageHTML);
    }
    form.reset();
};

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 3000);
}

function updateUI() {
    const count = document.getElementById('cart-count');
    if (count) count.innerText = cart.length;
    renderFullCart();
}

function renderFullCart() {
    const list = document.getElementById('full-cart-list');
    const total = document.getElementById('full-cart-total');
    if (!list) return;
    
    if (cart.length === 0) {
        list.innerHTML = '<p class="empty-msg">Корзина пуста</p>';
        if (total) total.innerText = "0";
        return;
    }

    list.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span>${item.name}</span>
            <span>${item.cost} ₽</span>
        </div>
    `).join('');
    
    if (total) total.innerText = cart.reduce((sum, item) => sum + item.cost, 0);
}

function maskCardNumber(e) {
    let value = e.target.value.replace(/\D/g, ''); 
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += value[i];
    }
    e.target.value = formatted.substring(0, 19); 
}

function maskExpiry(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
    } else {
        e.target.value = value;
    }
}

window.openPaymentModal = () => {
    if (cart.length === 0) return showToast("Корзина пуста!");
    document.getElementById('payment-modal')?.classList.add('active');
};

window.closePaymentModal = () => {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.remove('active');
        const err = document.getElementById('payment-error');
        if (err) err.classList.remove('active');
    }
};

window.togglePayFields = (method) => {
    const cardFields = document.getElementById('card-fields');
    const sbpFields = document.getElementById('sbp-fields');
    if (cardFields && sbpFields) {
        cardFields.style.display = method === 'card' ? 'block' : 'none';
        sbpFields.style.display = method === 'sbp' ? 'block' : 'none';
    }
};

window.processPayment = async () => {
    const user = auth.currentUser;
    const isVerified = sessionStorage.getItem('isVerified') === 'true';

    if (!user || !isVerified) {
        alert("Пожалуйста, войдите в аккаунт и подтвердите вход!");
        window.location.href = 'auth.html';
        return;
    }

    const cardRadio = document.getElementById('pay-card');
    const isCard = cardRadio ? cardRadio.checked : true;
    const err = document.getElementById('payment-error');
    
    if (isCard) {
        const numberInput = document.getElementById('card-number');
        const dateInput = document.getElementById('card-date');
        const cvcInput = document.getElementById('card-cvc');

        if (!numberInput.value || numberInput.value.length < 19 || dateInput.value.length < 5 || cvcInput.value.length < 3) {
            if (err) {
                err.innerText = "Заполните все данные карты!";
                err.classList.add('active');
            }
            return;
        }
    }

    try {
        const paymentPromises = cart.map(item => {
            return addDoc(collection(db, "users", user.uid, "keys"), {
                itemName: item.name,
                key: "SOFT-" + Math.random().toString(36).toUpperCase().substring(2, 12),
                date: new Date().toLocaleDateString()
            });
        });

        await Promise.all(paymentPromises);
        window.closePaymentModal();
        showToast("Оплата прошла успешно!");

        setTimeout(() => {
            cart = [];
            localStorage.setItem('softCart', JSON.stringify(cart));
            window.location.href = 'profile.html';
        }, 500); 
    } catch (e) {
        console.error("Ошибка оплаты:", e);
        alert("Ошибка доступа к базе данных.");
    }
};

window.addEventListener('DOMContentLoaded', () => {
    updateUI();

    const cardInput = document.getElementById('card-number');
    const expiryInput = document.getElementById('card-date');
    if (cardInput) cardInput.addEventListener('input', maskCardNumber);
    if (expiryInput) expiryInput.addEventListener('input', maskExpiry);

    const menu = document.getElementById('mobile-menu');
    const navList = document.getElementById('nav-list');
    if (menu && navList) {
        menu.onclick = () => {
            menu.classList.toggle('active');
            navList.classList.toggle('active');
            document.body.style.overflow = navList.classList.contains('active') ? 'hidden' : 'auto';
        };
    }

    onAuthStateChanged(auth, (user) => {
        const authLink = document.getElementById('nav-auth');
        const isVerified = sessionStorage.getItem('isVerified') === 'true';
        const path = window.location.pathname;
        const isAuthPage = path.includes('auth.html') || path === '/' || path.endsWith('kursovaya/');
        const isProfilePage = path.includes('profile.html');

        if (authLink) {
            if (user && isVerified) {
                authLink.textContent = 'Профиль';
                authLink.href = 'profile.html';
                
                const displayEmail = document.getElementById('user-email-display');
                const displayInitials = document.getElementById('user-initials');
                if (displayEmail) displayEmail.textContent = user.email;
                if (displayInitials) displayInitials.textContent = user.email.charAt(0).toUpperCase();

                if (!document.getElementById('logout-btn')) {
                    const logoutBtn = document.createElement('a');
                    logoutBtn.id = 'logout-btn';
                    logoutBtn.href = '#';
                    logoutBtn.textContent = 'Выйти';
                    logoutBtn.style.cssText = 'color: white; cursor: pointer; font-weight: 1000; margin-left: 15px;';
                    
                    logoutBtn.onclick = async (e) => {
                        e.preventDefault();
                        sessionStorage.removeItem('isVerified');
                        await signOut(auth);
                        window.location.href = 'auth.html';
                    };
                    authLink.after(logoutBtn);
                }
            } else {
                authLink.textContent = 'Аккаунт';
                authLink.href = 'auth.html';
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) logoutBtn.remove();

                if (isProfilePage && !isVerified) {
                    window.location.href = 'auth.html';
                }
            }
        }
    });
});