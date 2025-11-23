import { Controller, Post, Body } from '@nestjs/common';
import { rsaDecryptWithPrivate, aesDecrypt } from '../crypto/crypto.util';
import * as fs from 'fs';
import * as path from 'path';

@Controller('hybrid')
export class HybridController {
  
  /**
   * Endpoint para recibir paquete híbrido:
   * - encryptedKey: AES key cifrada con RSA-OAEP
   * - iv: Vector de inicialización
   * - encryptedData: Datos cifrados con AES
   */
  @Post('receive')
  async receiveHybrid(@Body() body: {
    encryptedKey: string;
    iv: string;
    encryptedData: string;
  }) {
    try {
      // 1. Cargar la clave privada del servidor
      const privateKeyPath = path.join(__dirname, '../../keys/server_private.pem');
      
      // Verificar si existe el archivo
      if (!fs.existsSync(privateKeyPath)) {
        throw new Error('Clave privada del servidor no encontrada. Ejecuta: npm run generate-keys');
      }
      
      const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');

      // 2. Descifrar la clave AES usando RSA-OAEP
      const aesKeyBuffer = rsaDecryptWithPrivate(body.encryptedKey, privateKeyPem);

      // 3. Descifrar los datos usando AES-CBC
      const ivBuffer = Buffer.from(body.iv, 'base64');
      const encryptedBuffer = Buffer.from(body.encryptedData, 'base64');
      
      const plaintext = aesDecrypt(encryptedBuffer, aesKeyBuffer, ivBuffer);

      // 4. Parsear el JSON (si es JSON)
      let data: any;
      try {
        data = JSON.parse(plaintext);
      } catch {
        data = plaintext; // Si no es JSON, devolver como string
      }

      return {
        success: true,
        mensaje: 'Paquete híbrido descifrado correctamente',
        data: data,
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        mensaje: 'Error al descifrar paquete híbrido',
      };
    }
  }
}