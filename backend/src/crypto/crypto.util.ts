// src/crypto/crypto.util.ts
import * as crypto from 'crypto';

export function genSalt(bytes = 16): Buffer {
  return crypto.randomBytes(bytes);
}

export function deriveKey(
  password: string,
  salt: Buffer,
  iterations = 100000,
  keylen = 32
): Buffer {
  return crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha256');
}

export function aesEncrypt(plaintext: string | Buffer, rawKey: Buffer) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', rawKey, iv);
  const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return { encrypted, iv };
}

export function aesDecrypt(encrypted: Buffer, rawKey: Buffer, iv: Buffer): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', rawKey, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

// ============ FUNCIONES PARA FIRMA DIGITAL ============

/**
 * Genera par de llaves RSA (pública/privada)
 */
export function generarParLlavesRSA(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { publicKey, privateKey };
}

/**
 * Cifra la clave privada usando AES-256-CBC con password del usuario
 */
export function cifrarClavePrivada(privateKey: string, password: string, salt: Buffer): string {
  const key = deriveKey(password, salt, 100000, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Retornar IV + encrypted concatenados
  return iv.toString('base64') + ':' + encrypted;
}

/**
 * Descifra la clave privada
 */
export function descifrarClavePrivada(encryptedPrivateKey: string, password: string, salt: Buffer): string {
  const [ivBase64, encryptedBase64] = encryptedPrivateKey.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const key = deriveKey(password, salt, 100000, 32);
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Firma datos usando clave privada (RSA-SHA256)
 */
export function firmarDatos(datos: string, privateKey: string): string {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(datos);
  sign.end();
  
  const firma = sign.sign(privateKey, 'base64');
  return firma;
}

/**
 * Verifica firma usando clave pública
 */
export function verificarFirma(datos: string, firma: string, publicKey: string): boolean {
  try {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(datos);
    verify.end();
    
    return verify.verify(publicKey, firma, 'base64');
  } catch (error) {
    return false;
  }
}

// ============ FUNCIONES PARA HÍBRIDO (RSA-OAEP) ============

/**
 * Descifra una clave AES que fue cifrada con RSA-OAEP
 * @param encryptedKeyBase64 - La clave AES cifrada en base64
 * @param privateKeyPem - La clave privada RSA en formato PEM
 * @returns Buffer con la clave AES descifrada
 */
export function rsaDecryptWithPrivate(encryptedKeyBase64: string, privateKeyPem: string): Buffer {
  const encryptedKey = Buffer.from(encryptedKeyBase64, 'base64');
  
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    encryptedKey
  );
  
  return decrypted;
}

/**
 * Cifra datos con RSA-OAEP usando clave pública
 * @param data - Datos a cifrar (Buffer)
 * @param publicKeyPem - Clave pública RSA en formato PEM
 * @returns String en base64 con datos cifrados
 */
export function rsaEncryptWithPublic(data: Buffer, publicKeyPem: string): string {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    data
  );
  
  return encrypted.toString('base64');
}