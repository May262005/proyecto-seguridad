// ========================================================
// CONFIGURACIÓN Y UTILIDADES DE SEGURIDAD (VERSIÓN FINAL)
// ========================================================
const API_URL = "http://localhost:3000"; 

// 1. Helpers para conversión (Texto <-> Base64)
function ab2b64(buf) { 
    return btoa(String.fromCharCode(...new Uint8Array(buf))); 
}
function b642ab(b64) { 
    const bin = atob(b64); 
    const arr = new Uint8Array(bin.length); 
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); 
    return arr.buffer; 
}

// 2. Derivar llave (ESTA ES LA FUNCIÓN QUE CAUSABA EL ERROR)
// Ahora devuelve un OBJETO con la llave matemática Y la versión texto
async function deriveKeyFromPassword(password, saltBase64) {
    const salt = b642ab(saltBase64);
    const enc = new TextEncoder();
    
    // A. Importar password
    const baseKey = await crypto.subtle.importKey(
        'raw', 
        enc.encode(password), 
        'PBKDF2', 
        false, 
        ['deriveKey', 'deriveBits']
    );

    // B. Generar la llave AES
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-CBC', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    // C. ¡ESTO ES LO NUEVO! Exportar la llave a texto para enviarla al backend
    const raw = await crypto.subtle.exportKey('raw', key);

    return { 
        key: key,               // Para usar aquí en el frontend
        rawBase64: ab2b64(raw)  // Para enviar al backend (Soluciona tu error)
    };
}

// 3. Encriptar con AES-CBC
async function aesEncryptWithIv(plaintextStr, cryptoKey) {
    const enc = new TextEncoder();
    const data = enc.encode(plaintextStr);
    const iv = crypto.getRandomValues(new Uint8Array(16)); 
    
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv: iv }, 
        cryptoKey, 
        data
    );
    
    return { 
        encryptedBase64: ab2b64(encrypted), 
        ivBase64: ab2b64(iv) 
    };
}