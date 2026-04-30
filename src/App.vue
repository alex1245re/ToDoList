<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'vue-router';

const auth = getAuth();
const router = useRouter();
const usuarioActual = ref(null);
const cargandoSesion = ref(true);
let detenerAuthState = null;

function mapearUsuario(user) {
    var resultado = null;
    if (user)
    resultado = {
        uid: user.uid,
        email: user.email,
        nombre: user.displayName || user.email
    };
    return resultado;
}

function manejarAutenticacion(usuario) {
    usuarioActual.value = usuario;
    router.push('/Recordatorios');
}

function manejarCierreSesion() {
    usuarioActual.value = null;
    router.push('/');
}

onMounted(() => {
    detenerAuthState = onAuthStateChanged(auth, (user) => {
        usuarioActual.value = mapearUsuario(user);
        cargandoSesion.value = false;
    });
});

onUnmounted(() => {
    if (detenerAuthState) {
        detenerAuthState();
    }
});
</script>   

<template>
    <p v-if="cargandoSesion">Cargando sesión...</p>
    <RouterView v-else v-slot="{ Component }">
        <component
            :is="Component"
            :usuario="usuarioActual"
            @logout="manejarCierreSesion"
            @authenticated="manejarAutenticacion"
        />
    </RouterView>
</template>

<style scoped></style>
