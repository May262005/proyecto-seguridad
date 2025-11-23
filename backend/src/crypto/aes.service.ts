// src/crypto/aes.service.ts
import { Injectable } from '@nestjs/common';
import { 
  deriveKey, 
  aesEncrypt, 
  aesDecrypt,
  generarParLlavesRSA,
  cifrarClavePrivada,
  descifrarClavePrivada,
  firmarDatos,
  verificarFirma
} from './crypto.util';

@Injectable()
export class AesService {
  /**
   * Cifra un texto con una key raw (Buffer de 32 bytes).
   * Retorna base64 del ciphertext y base64 del iv.
   */
  encryptWithRawKey(plaintext: string | Buffer, rawKey: Buffer) {
    const { encrypted, iv } = aesEncrypt(plaintext, rawKey);
    return {
      encryptedBase64: encrypted.toString('base64'),
      ivBase64: iv.toString('base64'),
    };
  }

  /**
   * Descifra dados base64 usando rawKey base64 o Buffer.
   * Devuelve string con plaintext.
   */
  decryptWithRawKey(encryptedBase64: string, ivBase64: string, rawKey: Buffer) {
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const plaintext = aesDecrypt(encrypted, rawKey, iv);
    return plaintext;
  }

  /**
   * Deriva key desde password + salt (opcionalmente si quieres hacer derivación en servidor).
   * Nota: preferimos que el cliente derive localmente. Esto es util si decides hacer demo derivando el servidor.
   */
  deriveKeyFromPassword(password: string, salt: Buffer, iterations = 100000) {
    return deriveKey(password, salt, iterations, 32); // Buffer
  }

  // ============ NUEVAS FUNCIONES PARA FIRMA DIGITAL ============

  /**
   * Genera par de llaves RSA
   */
  generarParLlaves() {
    return generarParLlavesRSA();
  }

  /**
   * Cifra clave privada con password del usuario
   */
  cifrarClavePrivada(privateKey: string, password: string, salt: Buffer) {
    return cifrarClavePrivada(privateKey, password, salt);
  }

  /**
   * Descifra clave privada con password del usuario
   */
  descifrarClavePrivada(encryptedPrivateKey: string, password: string, salt: Buffer) {
    return descifrarClavePrivada(encryptedPrivateKey, password, salt);
  }

  /**
   * Firma datos con clave privada
   */
  firmar(datos: string, privateKey: string) {
    return firmarDatos(datos, privateKey);
  }

  /**
   * Verifica firma con clave pública
   */
  verificar(datos: string, firma: string, publicKey: string) {
    return verificarFirma(datos, firma, publicKey);
  }
}