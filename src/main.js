import { createApp } from 'vue'
import App from './App.vue'
import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { VueFire } from 'vuefire'
import SupabaseStorage from "./components/SupabaseStorage.vue";
import { createRouter, createWebHistory } from 'vue-router'
import Recordatorios from './components/Recordatorios.vue'
import InicioSesion from './components/InicioSesion.vue'    


const firebaseConfig = {
    apiKey: "AIzaSyCV442EsoYkSREdgX_LpuoVlyEn4Xa5aIk",
    authDomain: "todolist-7d0d2.firebaseapp.com",
    projectId: "todolist-7d0d2",
    storageBucket: "todolist-7d0d2.firebasestorage.app",
    messagingSenderId: "743058124297",
    appId: "1:743058124297:web:cc879214a02dd1f9b912d8"
};

const firebaseApp = initializeApp(firebaseConfig);

const routes = [
    {path: '/Recordatorios', component: Recordatorios, meta: { requiresAuth: true }},
    {path: '/', component: InicioSesion, meta: { requiresAuth: false }}
]

export const router = createRouter({
    history: createWebHistory(),    
    routes
})

router.beforeEach((to) => {
    const user = getAuth().currentUser;
    if (to.meta.requiresAuth && !user) return '/';
    if (to.path === '/' && user) return '/Recordatorios';
});

let app;

onAuthStateChanged(getAuth(), () => {
    if (!app) {
        app = createApp(App);
        app.use(router);
        app.use(VueFire, { firebaseApp, modules: [] });
        app.mount('#app');
    }
});
