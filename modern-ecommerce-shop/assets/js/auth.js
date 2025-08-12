import { auth } from './firebase-init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        createUserWithEmailAndPassword(auth, email, password)
            .then(async () => {
                await Swal.fire('Success!', 'Account created successfully. Please login.', 'success');
                window.location.href = 'login.html';
            })
            .catch((error) => Swal.fire('Error', 'Could not create account. ' + error.message, 'error'));
    });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        signInWithEmailAndPassword(auth, email, password)
            .then(() => { window.location.href = 'dashboard.html'; })
            .catch(() => Swal.fire('Error', 'Invalid email or password.', 'error'));
    });
}

const adminLoginForm = document.getElementById('admin-login-form');
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const ADMIN_EMAIL = "admin@gmail.com";

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                if (userCredential.user.email.toLowerCase() === ADMIN_EMAIL) {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    signOut(auth);
                    Swal.fire('Access Denied', 'You are not authorized to access the admin panel.', 'error');
                }
            })
            .catch(() => {
                Swal.fire('Login Failed', 'Invalid admin credentials.', 'error');
            });
    });
}

export const handleLogout = (buttonId) => {
    const logoutButton = document.getElementById(buttonId);
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth)
                .then(() => {
                    Swal.fire({ title: 'Logged Out', icon: 'info', timer: 2000, showConfirmButton: false });
                    setTimeout(() => window.location.href = 'index.html', 1500);
                })
                .catch((error) => console.error('Logout Error:', error));
        });
    }
};