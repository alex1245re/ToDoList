<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase.js';

const emit = defineEmits(['archivoSubido']);
const archivo = ref(null);
const subiendo = ref(false);
const errorSubida = ref(false);

function adjuntarArchivo(e) {
    archivo.value = e.target.files[0];
}

async function subirArchivo() {
    if (!archivo.value) return '';
    subiendo.value = true;
    errorSubida.value = false;
    try {
        const nombreUnico = `${Date.now()}_${archivo.value.name}`;
        const { error } = await supabase.storage.from('AdjuntosRecordatorios').upload(nombreUnico, archivo.value);
        if (error) throw error;
        const { data } = supabase.storage.from('AdjuntosRecordatorios').getPublicUrl(nombreUnico);
        emit('archivoSubido', data.publicUrl);
        ultimoUrl.value = data.publicUrl;
        ultimoNombre.value = archivo.value.name;
        archivo.value = null;
        return data.publicUrl;
    } catch (err) {
        console.error('Error uploading file:', err);
        errorSubida.value = true;
        return '';
    } finally {
        subiendo.value = false;
    }
}

defineExpose({ subirArchivo });
</script>

<template>
    <div class="uploader">
        <label class="file-picker">
            <input type="file" @change="adjuntarArchivo" />
            <span class="file-btn">Seleccionar</span>
        </label>

        <div class="file-info">
            <span class="file-name" v-if="archivo">{{ archivo.name }}</span>
            <span class="msg" v-if="subiendo">Subiendo...</span>
            <span class="msg msg-success" v-else-if="ultimoUrl"><a :href="ultimoUrl" target="_blank" rel="noopener">ver</a></span>
        </div>
    </div>
</template>

<style scoped>
/* Layout */
.uploader {
    display: flex;
    align-items: center;
    gap: 12px;
}
.file-picker {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    position: relative;
}
.file-picker input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
    overflow: hidden;
}

/* Primary pick button */
.file-btn {
    background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
    color: #ffffff;
    padding: 8px 14px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 13px;
    box-shadow: 0 6px 18px rgba(59,130,246,0.12);
    border: none;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.file-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(59,130,246,0.14); }

.file-info {
    display: flex;
    align-items: center;
    gap: 10px;
}
.file-name {
    color: #d4d6dc;
    font-size: 13px;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Upload control */
.btn-upload {
    background: linear-gradient(135deg, #10b981 0%, #0ea5a6 100%);
    color: #061311;
    padding: 8px 12px;
    border-radius: 10px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: filter 0.12s ease, transform 0.08s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
.btn-upload:hover { filter: brightness(1.06); transform: translateY(-1px); }

/* Disabled (uploading) shows subtle spinner */
.btn-upload:disabled {
    opacity: 0.9;
    cursor: not-allowed;
    position: relative;
}
.btn-upload:disabled::after {
    content: '';
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(6,182,129,0.18);
    border-left-color: rgba(6,182,129,0.9);
    position: absolute;
    right: -30px;
    top: 50%;
    transform: translateY(-50%);
    animation: spin 0.9s linear infinite;
}

.msg {
    margin: 0 0 0 8px;
    font-size: 13px;
}
.msg-success a { color: #10b981; font-weight: 600 }
.msg-error { color: #ef4444; font-weight: 600 }

@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }
</style>