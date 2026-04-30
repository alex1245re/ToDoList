<script setup>
import { ref } from 'vue';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { FacebookAuthProvider } from "firebase/auth";

const emit = defineEmits(['authenticated']);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const auth = getAuth();
const errores = ref('');
const email = ref('');
const password = ref('');
const showPassword = ref(false);

function crearDatosUsuario(user) {
    return {
        uid: user.uid,
        email: user.email,
        nombre: user.displayName || user.email,
    };
}

function iniciarSesion(){
    signInWithEmailAndPassword(auth, email.value, password.value)
    .then((userCredential) => {
        const user = userCredential.user;
        errores.value = '';
        emit('authenticated', crearDatosUsuario(user));
    })
    .catch((error) => {
        errores.value = error.code;
    });
}

function iniciarSesionGoogle(){
    signInWithPopup(auth, googleProvider)
    .then((result) => {
    const user = result.user;
    errores.value = '';
    emit('authenticated', crearDatosUsuario(user));
    }).catch((error) => {
    errores.value = error.code;
    });
}

function iniciarSesionFacebook(){
    signInWithPopup(auth, facebookProvider)
    .then((result) => {
    const user = result.user;
    errores.value = '';
    emit('authenticated', crearDatosUsuario(user));
    }).catch((error) => {
    errores.value = error.code;
    });
}

function crearUsuario(){
    createUserWithEmailAndPassword(auth, email.value, password.value)
    .then((userCredential) => {
    const user = userCredential.user;
    errores.value = '';
    emit('authenticated', crearDatosUsuario(user));
    })
    .catch((error) => {
    errores.value = error.code;
    });
}

function toggleShowPassword(){
    showPassword.value = !showPassword.value;
}

</script>

<template>
    <div class="auth-bg">
        <div class="auth-card">
            <div class="auth-brand">
                <span class="auth-logo">✓</span>
                <h1 class="auth-title">ToDoList</h1>
            </div>
            <p class="auth-subtitle">Inicia sesión o crea tu cuenta para continuar</p>

            <div class="form-group">
                <label class="form-label">Correo electrónico</label>
                <input
                    class="form-input"
                    type="text"
                    placeholder="correo@ejemplo.com"
                    v-model="email"
                    @keyup.enter="iniciarSesion"
                />
            </div>
            <div class="form-group password-field">
                <label class="form-label">Contraseña</label>
                <div class="input-with-button">
                    <input
                        class="form-input inner-input"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="••••••••"
                        v-model="password"
                        @keyup.enter="iniciarSesion"
                    />
                    <button type="button" class="password-toggle" @click="toggleShowPassword" :aria-pressed="showPassword" aria-label="Mostrar contraseña">
                        <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M12 5c-7 0-11 6-11 7s4 7 11 7 11-6 11-7-4-7-11-7z" stroke="#cbd5e1" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="12" r="3" stroke="#cbd5e1" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M3 3l18 18" stroke="#cbd5e1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M10.58 10.58A3 3 0 0013.42 13.42" stroke="#cbd5e1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9.88 5.05a16.94 16.94 0 011.67-.05c7 0 11 6 11 7 0 .55-.53 1.75-1.5 2.85" stroke="#cbd5e1" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M6.2 6.2A16.94 16.94 0 004 12c0 .55.53 1.75 1.5 2.85" stroke="#cbd5e1" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>

            <p v-if="errores" class="msg-error">{{ errores }}</p>

            <div class="btn-group">
                <button class="btn btn-primary" @click="iniciarSesion">Iniciar Sesión</button>
                <button class="btn btn-outline" @click="crearUsuario">Registrarse</button>
            </div>

            <div class="divider"><span>o continúa con</span></div>

            <div class="btn-group">
                <button class="btn btn-google" @click="iniciarSesionGoogle">
                    <svg class="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                </button>
                <button class="btn btn-facebook" @click="iniciarSesionFacebook">
                    <svg class="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                    </svg>
                    Facebook
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.auth-bg {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 20% 0%, #212530 0%, #15171d 55%, #121319 100%);
    padding: 24px;
}

.auth-card {
    width: 100%;
    max-width: 440px;
    background: #1e2128;
    border: 1px solid #2f333f;
    border-radius: 20px;
    padding: 40px 36px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
}

.auth-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.auth-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: linear-gradient(135deg, #10b981 0%, #0ea5a6 100%);
    color: #061311;
    font-size: 22px;
    font-weight: 700;
}

.auth-title {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: #f8fafc;
    letter-spacing: 0.3px;
}

.auth-subtitle {
    margin: 0 0 28px;
    color: #8f96a6;
    font-size: 15px;
}

.form-group {
    margin-bottom: 18px;
}

.password-field { position: relative; }
.input-with-button {
    display: flex;
    align-items: center;
    background: #262a35;
    border: 1px solid #3a3f4b;
    border-radius: 12px;
    overflow: hidden;
}
.input-with-button .inner-input {
    border: 0;
    background: transparent;
    padding: 13px 12px;
    font-size: 16px;
    color: #f0f4f8;
    outline: none;
    flex: 1 1 auto;
}
.password-toggle {
    background: transparent;
    border: none;
    padding: 8px 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #c8cdd8;
    width: 48px;
    height: 48px;
}
.password-toggle svg { display: block; }
.password-toggle:focus { outline: 2px solid rgba(16,185,129,0.18); border-radius: 8px; }

.form-label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #c8cdd8;
}

.form-input {
    width: 100%;
    box-sizing: border-box;
    background: #262a35;
    border: 1px solid #3a3f4b;
    border-radius: 12px;
    padding: 13px 16px;
    font-size: 16px;
    color: #f0f4f8;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input::placeholder {
    color: #525a6b;
}

.form-input:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
}

.msg-error {
    margin: -4px 0 18px;
    padding: 10px 14px;
    background: #421416;
    border: 1px solid #ef4444;
    border-radius: 10px;
    color: #fca5a5;
    font-size: 14px;
}

.msg-success {
    margin: -4px 0 18px;
    padding: 10px 14px;
    background: #052e16;
    border: 1px solid #10b981;
    border-radius: 10px;
    color: #6ee7b7;
    font-size: 14px;
}

.btn-group {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
}

.btn {
    flex: 1;
    padding: 13px 18px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: filter 0.18s, transform 0.12s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn:hover {
    filter: brightness(1.12);
}

.btn:active {
    transform: scale(0.97);
}

.btn-primary {
    background: linear-gradient(135deg, #10b981 0%, #0ea5a6 100%);
    color: #061311;
}

.btn-outline {
    background: transparent;
    border: 1px solid #3a3f4b;
    color: #c8cdd8;
}

.btn-outline:hover {
    background: #262a35;
    filter: none;
}

.divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 4px 0 16px;
    color: #525a6b;
    font-size: 13px;
}

.divider::before,
.divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #2f333f;
}

.btn-google {
    background: #f8fafc;
    color: #1a1a2e;
}

.btn-facebook {
    background: #1877f2;
    color: #fff;
}

.social-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}
</style>