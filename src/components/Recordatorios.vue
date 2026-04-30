<script setup>
import { computed, onMounted, ref } from 'vue';
import { getAuth, signOut } from 'firebase/auth';
import { supabase } from '../supabase.js';
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, query, updateDoc, where } from 'firebase/firestore';

const props = defineProps({
    usuario: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(['logout']);
const db = getFirestore();
const auth = getAuth();
const collectionName = 'ToDoList';
const item = ref('');
const nuevaPrioridad = ref('Normal');
const listaTareas = ref([]);
const prioridadAnimando = ref({});
const urlArchivoTemporal = ref('');
const archivoSeleccionado = ref(null);
const fileInput = ref(null);
const subiendo = ref(false);

function capturarArchivo(e) {
    archivoSeleccionado.value = e.target.files[0];
}

const consultaItems = query(
    collection(db, collectionName),
    where('usuarioId', '==', props.usuario.uid)
);
const ADMIN_EMAIL = ['admin@gmail.com'];
const esAdmin = computed(() => ADMIN_EMAIL.includes(props.usuario.email));

const prioridadOrden = { High: 0, Normal: 1 , Low: 2 };

function obtenerValorPrioridad(tarea) {
    const nivel = tarea.prioridad || 'Normal';
    return prioridadOrden[nivel] ?? 1;
}

const listaOrdenada = computed(() => {
    const copiaLista = [...listaTareas.value];

    return copiaLista.sort((a, b) => {
        const valorA = obtenerValorPrioridad(a);
        const valorB = obtenerValorPrioridad(b);
        
        return valorA - valorB;
    });
});

const totalTareas = computed(() => listaTareas.value.length);
const tareasRestantes = computed(() => listaTareas.value.filter((tarea) => !tarea.completado).length);
const tareasCompletadas = computed(() => listaTareas.value.filter((tarea) => tarea.completado).length);

async function cargarTareas() {
        const recordatorios = esAdmin.value ? collection(db, collectionName) : consultaItems;
        const snapshot = await getDocs(recordatorios);
        listaTareas.value = snapshot.docs.map((documento) => ({
            id: documento.id,
            ...documento.data(),
        }));
}

onMounted(() => {
    cargarTareas();
});

async function agregarItem() {
    if (item.value.trim() != ''){
        subiendo.value = true;
        
        if (archivoSeleccionado.value) {
            const nombreUnico = `${Date.now()}_${archivoSeleccionado.value.name}`;
            const { error } = await supabase.storage.from('AdjuntosRecordatorios').upload(nombreUnico, archivoSeleccionado.value);

            if (!error) {
                const { data } = supabase.storage.from('AdjuntosRecordatorios').getPublicUrl(nombreUnico);
                urlArchivoTemporal.value = data.publicUrl;
            }
        }
        await addDoc(collection(db, collectionName), {
            nombre: item.value,
            completado: false,
            edicion: false,
            usuarioId: props.usuario.uid,
            prioridad: nuevaPrioridad.value,
            nombreAutor: props.usuario.nombre,
            archivoUrl: urlArchivoTemporal.value
        });
        item.value = '';
        nuevaPrioridad.value = 'Normal';
        archivoSeleccionado.value = null;
        if (fileInput.value) {
            fileInput.value.value = '';
        }
        urlArchivoTemporal.value = '';
        subiendo.value = false;
        await cargarTareas();
    }
}

async function borrarCompletadas() {
    const completadas = listaTareas.value.filter((elemento) => elemento.completado);
    if (completadas.length > 0){
        await Promise.all(
            completadas.map((elemento) => deleteDoc(doc(db, collectionName, elemento.id)))
        );
        await cargarTareas();
    }
}

async function eliminarItem(elemento) {
    await deleteDoc(doc(db, collectionName, elemento.id));
    await cargarTareas();
}

function habilitarEdicion(elemento) {
    const tarea = listaTareas.value.find((t) => t.id === elemento.id);
    if (tarea) tarea.edicion = true;
}

async function editarItem(elemento) {
    await updateDoc(doc(db, collectionName, elemento.id), {
        nombre: elemento.nombre,
        edicion: false,
    });
    await cargarTareas();
}

async function cambiarEstado(elemento) {
    await updateDoc(doc(db, collectionName, elemento.id), {
        completado: !elemento.completado,
    });
    await cargarTareas();
}

async function cambiarPrioridad(elemento, prioridad) {
    prioridadAnimando.value = { ...prioridadAnimando.value, [elemento.id]: true };
    await updateDoc(doc(db, collectionName, elemento.id), {
        prioridad,
    });
    await cargarTareas();
    setTimeout(() => {
        const copia = { ...prioridadAnimando.value };
        delete copia[elemento.id];
        prioridadAnimando.value = copia;
    }, 600);
}

async function cerrarSesion() {
    await signOut(auth);
    emit('logout');
}
</script>

<template>
    <section class="todo-shell">
        <header class="todo-header">
            <h1>Proyecto Vue.js - {{ usuario.nombre }}</h1>
            <button class="logout-button" @click="cerrarSesion">Cerrar sesion</button>
        </header>

        <div class="add-row">
            <div class="input-wrap">
                <input v-model="item" class="task-input" placeholder="Que quieres recordar?" @keyup.enter="agregarItem">

                <div class="chip-wrap">
                    <select v-model="nuevaPrioridad" class="priority-select chip" aria-label="Prioridad">
                        <option value="Low">Low</option>
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                    </select>
                    <span class="chip-arrow" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9l6 6 6-6" stroke="#e6eef3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                </div>
            </div>

            <label class="file-upload" :class="{ disabled: subiendo }">
                <input type="file" ref="fileInput" @change="capturarArchivo" :disabled="subiendo">
                <span class="file-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" stroke="#06202a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 13l5-5 5 5" stroke="#06202a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Adjuntar</span>
                </span>
                <span class="file-name" v-if="archivoSeleccionado">{{ archivoSeleccionado.name }}</span>
            </label>

            <button class="add-button" @click="agregarItem" :disabled="subiendo">
                <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="#021124" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Agregar</span>
            </button>
        </div>

        <div class="summary-row">
            <p v-if="!esAdmin">{{ tareasRestantes }} tareas pendientes de un total de {{ totalTareas }}</p>
            <button class="clear-completed" @click="borrarCompletadas">Borrar tareas completadas</button>
        </div>

        <ul class="task-list">
            <li
                v-for="(elemento) in listaOrdenada" :key="elemento.id"
                class="task-item"
                :class="{ completed: elemento.completado, 'priority-flash': prioridadAnimando[elemento.id] }"
            >
            <a v-if="elemento.archivoUrl" class="archivo-link" :href="elemento.archivoUrl" target="_blank" rel="noopener">Ver archivo</a>
                <div class="task-left">
                    <label class="checkbox">
                        <input
                            type="checkbox"
                            :checked="elemento.completado"
                            @change="cambiarEstado(elemento)"
                        />
                        <span class="checkbox-custom" aria-hidden="true"></span>
                    </label>

                    <div class="task-content">
                        <template v-if="elemento.edicion">
                            <input
                                v-model="elemento.nombre"
                                class="edit-input"
                                @keyup.enter="editarItem(elemento)"
                            >
                        </template>
                        <template v-else>
                            <p class="task-title">{{ elemento.nombre }}</p>
                            <p class="task-meta">
                                Prioridad:
                                <span class="badge" :class="`badge-${(elemento.prioridad || 'Normal').toLowerCase()}`">
                                    {{ elemento.prioridad || 'Normal' }}
                                </span>
                                <template v-if="esAdmin">
                                    | Usuario: <span class="badge badge-admin">{{ elemento.nombreAutor }}</span>
                                </template>
                            </p>
                            <div class="priority-controls">
                                <button
                                    class="priority-button low"
                                    :class="{ active: (elemento.prioridad || 'Normal') === 'Low' }"
                                    @click="cambiarPrioridad(elemento, 'Low')"
                                >
                                    Low
                                </button>
                                <button
                                    class="priority-button normal"
                                    :class="{ active: (elemento.prioridad || 'Normal') === 'Normal' }"
                                    @click="cambiarPrioridad(elemento, 'Normal')"
                                >
                                    Normal
                                </button>
                                <button
                                    class="priority-button high"
                                    :class="{ active: (elemento.prioridad || 'Normal') === 'High' }"
                                    @click="cambiarPrioridad(elemento, 'High')"
                                >
                                    High
                                </button>
                            </div>
                        </template>
                    </div>
                </div>

                <div class="task-actions">
                    <button v-if="elemento.edicion" class="save" @click="editarItem(elemento)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://w3.org">
                        <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M17 21V13H7V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 3V8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button v-else class="edit" @click="habilitarEdicion(elemento)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://w3.org">
                        <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="delete" @click="eliminarItem(elemento)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://w3.org">
                        <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </li>
        </ul>

        <footer class="todo-footer">
            <p>Desarrollado por Alejandro Felipe Diaz.</p>
            <p>Codigo disponible en GitHub.</p>
        </footer>
    </section>
</template>

<style scoped>
:global(body) {
    margin: 0;
    background: radial-gradient(circle at 20% 0%, #212530 0%, #15171d 55%, #121319 100%);
    color: #f8fafc;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.todo-shell {
    max-width: 1280px;
    margin: 0 auto;
    padding: 48px 32px 40px;
}

.todo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
}

.todo-header h1 {
    margin: 0;
    font-size: clamp(30px, 3.2vw, 48px);
    font-weight: 500;
    letter-spacing: 0.2px;
}

.logout-button {
    border: 1px solid #ff7b6f;
    color: #ffd4ce;
    background: transparent;
    border-radius: 10px;
    padding: 10px 14px;
    cursor: pointer;
    transition: background 0.18s, color 0.18s;
}

.logout-button:hover {
    background: rgba(255, 123, 111, 0.12);
}

.add-row {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    align-items: center;
}

.input-wrap { flex: 1 1 auto; position: relative; }
.priority-select.compact { width: 110px; }

.task-input { padding-right: 160px; }

.priority-select.chip {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    appearance: none;
    -webkit-appearance: none;
    border: none;
    background: linear-gradient(180deg, #091022 0%, #0b1220 100%);
    padding: 6px 44px 6px 14px;
    border-radius: 999px;
    font-weight: 800;
    color: #ffffff;
    cursor: pointer;
    box-shadow: inset 0 -6px 18px rgba(0,0,0,0.28), 0 6px 14px rgba(2,8,18,0.22);
    height: 40px;
    line-height: 18px;
    border: 1px solid rgba(255,255,255,0.06);
    font-size: 14px;
}

.priority-select.chip:focus { outline: none; box-shadow: 0 6px 18px rgba(14,165,166,0.08); }

.chip-wrap { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: inline-flex; align-items: center; }
.chip-arrow { position: absolute; right: 14px; display: inline-flex; align-items: center; justify-content: center; pointer-events: none; }
.priority-select.chip::-ms-expand { display: none; }

/* Improve dropdown option visibility where supported */
.priority-select.chip option { background-color: #0b1220; color: #fff; }

.chip-arrow svg path { stroke: #ffffff !important; }

.priority-select {
    border: 1px solid #3a3f4b;
    border-radius: 12px;
    padding: 0 12px;
    background: #262a35;
    color: #e2e8f0;
    font-size: 16px;
    min-width: 120px;
}

.task-input,
.edit-input {
    width: 100%;
    border: 1px solid #2f333a;
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 18px;
    background: #f6f7fb;
    color: #212121;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s, transform 0.1s;
    height: 46px;
    box-sizing: border-box;
}

.task-input:focus,
.edit-input:focus {
    border-color: #0ea5a6;
    box-shadow: 0 6px 18px rgba(14,165,166,0.06);
    transform: translateY(-1px);
}

.add-button {
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 10px;
    padding: 8px 14px;
    font-weight: 600;
    cursor: pointer;
    background: linear-gradient(180deg, #06b6d4 0%, #0ea5a6 100%);
    color: #021124;
    transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    box-shadow: 0 6px 14px rgba(14,165,166,0.06);
}

.add-button:hover {
    transform: translateY(-2px);
    filter: brightness(1.02);
}

.add-button:active {
    transform: translateY(0);
}

.add-button[disabled], .add-button.disabled {
    opacity: 0.6;
    pointer-events: none;
}
.add-button[disabled], .add-button.disabled {
    opacity: 0.55;
    pointer-events: none;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    border-top: 1px solid #2f333f;
    border-bottom: 1px solid #2f333f;
    padding: 16px 0;
    color: #d4d6dc;
}

.summary-row p {
    margin: 0;
    font-size: 22px;
}

.clear-completed {
    border: none;
    background: transparent;
    color: #f59e0b;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.18s;
}

.clear-completed:hover {
    color: #fbbf24;
}

.error-box {
    margin: 12px 0;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #ef4444;
    background: #421416;
    color: #fecaca;
}

.task-list {
    list-style: none;
    padding: 0;
    margin: 22px 0 40px;
    border: 1px solid #2f333f;
    border-radius: 10px;
    overflow: hidden;
    background: #1e2128;
}

.task-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 18px 20px;
    border-bottom: 1px solid #343a46;
    transition: background 0.15s;
}

.task-item:hover {
    background: #232730;
}

.task-item:last-child {
    border-bottom: none;
}

.task-left {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    flex: 1;
}

/* Custom checkbox styles */
.checkbox {
    position: relative;
    display: inline-flex;
    align-items: center;
    margin-right: 6px;
}
.checkbox input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
    overflow: hidden;
    pointer-events: auto;
}
.checkbox-custom {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 2px solid #3a3f4b;
    background: linear-gradient(180deg, #23272b 0%, #1e2128 100%);
    display: inline-block;
    box-sizing: border-box;
    transition: background 0.18s, border-color 0.18s, transform 0.12s;
    position: relative;
}
.checkbox-custom::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 3px;
    width: 6px;
    height: 12px;
    border: solid transparent;
    border-width: 0 3px 3px 0;
    transform: rotate(45deg) scale(0);
    transition: transform 0.12s ease-out;
}
.checkbox input:focus + .checkbox-custom {
    box-shadow: 0 0 0 4px rgba(16,185,129,0.12);
    border-color: #10b981;
}
.checkbox input:checked + .checkbox-custom {
    background: linear-gradient(135deg, #10b981 0%, #0ea5a6 100%);
    border-color: #10b981;
    transform: scale(0.98);
}
.checkbox input:checked + .checkbox-custom::after {
    border-color: #061311;
    transform: rotate(45deg) scale(1);
}

.task-content {
    width: 100%;
}

.task-title {
    margin: 0;
    font-size: clamp(26px, 2.4vw, 52px);
    line-height: 1.1;
    color: #f8fafc;
}

.task-meta {
    margin: 8px 0 0;
    color: #8f96a6;
    font-size: 18px;
}

.badge {
    display: inline-block;
    border-radius: 6px;
    padding: 2px 8px;
    background: #64748b;
    color: #f1f5f9;
    font-size: 14px;
}

.badge-low {
    background: #0ea5e9;
    color: #e0f2fe;
}

.badge-normal {
    background: #2563eb;
    color: #dbeafe;
}

.badge-high {
    background: #ef4444;
    color: #fee2e2;
}

.badge-admin {
    background: #7c3aed;
    color: #ede9fe;
    font-size: 11px;
    word-break: break-all;
}

.priority-controls {
    display: flex;
    gap: 6px;
    margin-top: 8px;
}

.priority-button {
    border: 1px solid #3b4252;
    background: #202430;
    color: #cbd5e1;
    border-radius: 8px;
    padding: 4px 9px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
}

.priority-button:hover {
    filter: brightness(1.2);
}

.priority-button:active {
    transform: scale(0.95);
}

.priority-button.low.active {
    background: #0ea5e9;
    border-color: #0ea5e9;
    color: #082f49;
}

.priority-button.normal.active {
    background: #2563eb;
    border-color: #2563eb;
    color: #dbeafe;
}

.priority-button.high.active {
    background: #ef4444;
    border-color: #ef4444;
    color: #fee2e2;
}

.task-item.completed .task-title {
    color: #00d1a0;
    text-decoration: line-through;
}

.task-actions {
    display: flex;
    gap: 8px;
}

.task-actions button {
    border: none;
    border-radius: 10px;
    padding: 10px 14px;
    cursor: pointer;
    transition: filter 0.15s, transform 0.1s;
}

.task-actions button:hover {
    filter: brightness(1.15);
}

.task-actions button:active {
    transform: scale(0.95);
}

.task-actions .edit,
.task-actions .save {
    background: #334155;
    color: #e2e8f0;
}

.task-actions .delete {
    background: #ef4444;
    color: #fff;
    font-size: 24px;
    line-height: 1;
    width: 44px;
    height: 44px;
}

/* Link to attached file */
.archivo-link {
    display: inline-block;
    background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%);
    color: #fff;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    margin-right: 12px;
    box-shadow: 0 8px 20px rgba(59,130,246,0.08);
    transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.archivo-link:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(59,130,246,0.12); }

/* Styled file input */
.file-upload {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
}
.file-upload input[type="file"] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
}
.file-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(180deg, #f8fafc 0%, #eef6f8 100%);
    color: #06202a;
    padding: 8px 12px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    border: 1px solid rgba(2,17,26,0.06);
    box-shadow: 0 6px 14px rgba(2,17,26,0.04);
    transition: transform 0.12s ease, filter 0.12s ease;
    min-height: 44px;
}

.file-button:hover { transform: translateY(-2px); }
.file-button:hover { transform: translateY(-2px); filter: brightness(1.05); }
.file-name {
    font-size: 14px;
    color: #cbd5e1;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.file-upload { display: inline-flex; align-items: center; gap: 12px; }
.file-upload.disabled .file-button { opacity: 0.5; pointer-events: none; }

.todo-footer {
    text-align: center;
    color: #a5afbe;
    font-size: 24px;
    border-top: 1px solid #2f333f;
    padding-top: 24px;
}

.todo-footer p {
    margin: 6px 0;
}

@keyframes priorityPulse {
    0%   { transform: scale(1);    box-shadow: 0 0 0 0   rgba(16, 185, 129, 0.45); }
    35%  { transform: scale(1.015); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.15); }
    70%  { transform: scale(1.005); box-shadow: 0 0 0 14px rgba(16, 185, 129, 0);  }
    100% { transform: scale(1);    box-shadow: none; }
}

.priority-flash {
    animation: priorityPulse 0.6s ease-out;
}
</style>