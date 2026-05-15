import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    fetchSignInMethodsForEmail 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { resetPassword } from './firebase-config.js';

(function() {
    emailjs.init("2NFmKB2jDyx70OTFq"); 
})();

let generatedCode = null;
let currentMode = ''; 

const errorBlock = document.getElementById('auth-error');
const confirmSection = document.getElementById('confirm-section');
const signUpBtn = document.getElementById('signUpBtn');
const signInBtn = document.getElementById('signInBtn');
const verifyBtn = document.getElementById('verifyBtn');

const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const forgotLink = document.getElementById('forgot-link');

function showError(msg) {
    errorBlock.innerText = msg;
    errorBlock.classList.add('active');
}

function hideError() {
    errorBlock.innerText = "";
    errorBlock.classList.remove('active');
}

async function sendMail(email) {
    generatedCode = Math.floor(100000 + Math.random() * 900000);
    return emailjs.send('service_6asvew4', 'template_oy0f56v', {
        to_email: email,
        code: generatedCode
    });
}

function hideAuthButtons() {
    signUpBtn.style.setProperty('display', 'none', 'important');
    signInBtn.style.setProperty('display', 'none', 'important');
    if(forgotLink) forgotLink.style.display = 'none';
}

function showAuthUI() {
    passInput.style.display = 'block';
    signUpBtn.style.display = 'block';
    signInBtn.style.display = 'block';
    if(forgotLink) forgotLink.style.display = 'block';
    
    document.getElementById('reset-action-btn')?.remove();
    document.getElementById('cancel-reset-btn')?.remove();
    hideError();
}

if (forgotLink) {
    forgotLink.onclick = (e) => {
        e.preventDefault();
        hideError();

        passInput.style.display = 'none';
        signUpBtn.style.display = 'none';
        signInBtn.style.display = 'none';
        forgotLink.style.display = 'none';

        if (!document.getElementById('reset-action-btn')) {
            const resetBtn = document.createElement('button');
            resetBtn.id = 'reset-action-btn';
            resetBtn.className = 'action-btn';
            resetBtn.innerText = 'Сбросить пароль';
            
            resetBtn.onclick = async () => {
                const email = emailInput.value.trim();
                if (!email) return showError("Введите email!");
                
                try {
                    resetBtn.disabled = true;
                    resetBtn.innerText = "Отправка...";
                    
                    await resetPassword(); 
                    
                    showAuthUI(); 
                } catch (e) {
                    showError("Ошибка: " + e.message);
                } finally {
                    resetBtn.disabled = false;
                    resetBtn.innerText = "Сбросить пароль";
                }
            };

            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancel-reset-btn';
            cancelBtn.className = 'clear-btn';
            cancelBtn.innerText = 'Отмена';
            cancelBtn.style.marginTop = '10px';
            cancelBtn.onclick = showAuthUI;

            forgotLink.parentNode.insertBefore(resetBtn, errorBlock);
            forgotLink.parentNode.insertBefore(cancelBtn, errorBlock);
        }
    };
}

signUpBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const pass = passInput.value;
    hideError();

    if (!email || pass.length < 6) return showError("Email и пароль (мин. 6 симв.)");

    signUpBtn.disabled = true;
    signUpBtn.innerText = "Проверка...";

    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
            showError("Эта почта уже занята!");
            signUpBtn.disabled = false;
            signUpBtn.innerText = "Регистрация";
            return;
        }

        await sendMail(email);
        currentMode = 'signup';
        hideAuthButtons();
        confirmSection.classList.add('active');
    } catch (e) {
        showError("Ошибка: " + e.message);
        signUpBtn.disabled = false;
        signUpBtn.innerText = "Регистрация";
    }
};

signInBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const pass = passInput.value;
    hideError();

    if (!email || !pass) return showError("Введите данные");

    signInBtn.disabled = true;
    signInBtn.innerText = "Проверка...";

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        await sendMail(email);
        currentMode = 'login';
        hideAuthButtons();
        confirmSection.classList.add('active');
    } catch (e) {
        showError("Неверная почта или пароль");
        signInBtn.disabled = false;
        signInBtn.innerText = "Войти";
    }
};

verifyBtn.onclick = async () => {
    const userCode = document.getElementById('confirm-code-input').value.trim();
    const email = emailInput.value.trim();
    const pass = passInput.value;

    if (userCode != generatedCode) return showError("Неверный код!");

    verifyBtn.disabled = true;
    verifyBtn.innerText = "Вход...";

    try {
        if (currentMode === 'signup') {
            await createUserWithEmailAndPassword(auth, email, pass);
        }
        sessionStorage.setItem('isVerified', 'true'); 
        window.location.href = 'profile.html';
    } catch (e) {
        showError("Ошибка: " + e.message);
        verifyBtn.disabled = false;
        verifyBtn.innerText = "Подтвердить";
    }
};