// src/tarjetas/tarjetas.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tarjeta } from './tarjeta.entity';
import { Repository } from 'typeorm';
import { AesService } from '../crypto/aes.service';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class TarjetasService {
  constructor(
    @InjectRepository(Tarjeta) private repo: Repository<Tarjeta>,
    @InjectRepository(Usuario) private userRepo: Repository<Usuario>,
    private aesService: AesService,
  ) {}

  /**
   * Helper para formatear fecha de forma consistente
   */
  private formatearFecha(fecha: any): string {
    if (!fecha) return '';
    // Si ya es string, devolverlo limpio
    if (typeof fecha === 'string') {
      return fecha.split('T')[0];
    }
    // Si es Date, formatear manualmente para evitar problemas de zona horaria
    if (fecha instanceof Date) {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Intentar convertir
    return String(fecha).split('T')[0];
  }

  /**
   * Guarda una tarjeta cifrada (JSON cifrado completo) + FIRMA DIGITAL
   */
  async guardar(id_usuario: number, body: any) {
    if (!body.password) {
      throw new BadRequestException('Se requiere el password para firmar la tarjeta');
    }

    const usuario = await this.userRepo.findOne({ 
      where: { id_usuario } 
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!usuario.clave_privada_cifrada || !usuario.clave_publica) {
      throw new BadRequestException('Usuario sin llaves RSA. Re-registrar usuario.');
    }

    let clavePrivada: string;
    try {
      clavePrivada = this.aesService.descifrarClavePrivada(
        usuario.clave_privada_cifrada,
        body.password,
        usuario.salt,
      );
    } catch (error) {
      throw new UnauthorizedException('Password incorrecto para descifrar clave privada');
    }

    const payload = Buffer.from(body.payload_encrypted, 'base64');
    const iv = Buffer.from(body.iv, 'base64');

    // IMPORTANTE: Redondear a segundos porque MySQL TIMESTAMP no guarda milisegundos
    const timestamp = Math.floor(Date.now() / 1000) * 1000;
    
    // USAR EL MISMO FORMATO que se guardará en BD
    const fechaFormateada = this.formatearFecha(body.fecha_expiracion);
    
    // CREAR DATOS A FIRMAR
    const datosAFirmar = `${body.payload_encrypted}|${body.iv}|${fechaFormateada}|${timestamp}`;
    
    console.log('=== GUARDANDO ===');
    console.log('fechaFormateada:', fechaFormateada);
    console.log('timestamp:', timestamp);
    console.log('datosAFirmar:', datosAFirmar);
    
    const firma = this.aesService.firmar(datosAFirmar, clavePrivada);

    const ent = this.repo.create({
      id_usuario,
      numero_tarjeta: payload,
      ccv: Buffer.from(''),
      iv,
      fecha_expiracion: fechaFormateada,
      firma,
      fecha_creacion: new Date(timestamp),
    });

    const saved = await this.repo.save(ent);

    return {
      mensaje: 'Tarjeta guardada y firmada digitalmente con éxito',
      id_tarjeta: saved.id_tarjeta,
      firma: firma.substring(0, 50) + '...',
      firma_completa_length: firma.length,
    };
  }

  /**
   * Solo para inspección (datos crudos de la BD)
   */
  async obtenerYCifrarParaUsuario(id_usuario: number) {
    const tarjetas = await this.repo.find({ 
      where: { id_usuario },
      relations: ['usuario']
    });

    return tarjetas.map(t => {
      const fechaStr = this.formatearFecha(t.fecha_expiracion);
      const timestampStr = String(new Date(t.fecha_creacion).getTime());

      const datosAVerificar = `${t.numero_tarjeta.toString('base64')}|${t.iv.toString('base64')}|${fechaStr}|${timestampStr}`;
      
      const firmaValida = t.firma && t.usuario.clave_publica
        ? this.aesService.verificar(datosAVerificar, t.firma, t.usuario.clave_publica)
        : false;

      return {
        id_tarjeta: t.id_tarjeta,
        numero_tarjeta_cifrado: t.numero_tarjeta.toString('base64').substring(0, 50) + '...',
        iv: t.iv.toString('base64'),
        fecha_expiracion: fechaStr,
        firma: t.firma ? t.firma.substring(0, 50) + '...' : null,
        firma_valida: firmaValida,
        fecha_creacion: t.fecha_creacion,
      };
    });
  }

  /**
   * Descifrar tarjetas con la clave derivada enviada por el cliente.
   */
  async obtenerYDescifrar(id_usuario: number, derivedKeyBase64: string) {
    const rawKey = Buffer.from(derivedKeyBase64, 'base64');

    const tarjetas = await this.repo.find({ 
      where: { id_usuario },
      relations: ['usuario']
    });

    return tarjetas.map(t => {
      const jsonStr = this.aesService.decryptWithRawKey(
        (t.numero_tarjeta as Buffer).toString('base64'),
        (t.iv as Buffer).toString('base64'),
        rawKey
      );

      let datos: any = {};
      try {
        datos = JSON.parse(jsonStr);
      } catch {
        datos = { error: 'JSON inválido al descifrar' };
      }

      // USAR EL MISMO FORMATO
      const fechaStr = this.formatearFecha(t.fecha_expiracion);
      const timestampStr = String(new Date(t.fecha_creacion).getTime());

      const datosAVerificar = `${t.numero_tarjeta.toString('base64')}|${t.iv.toString('base64')}|${fechaStr}|${timestampStr}`;
      
      console.log('=== VERIFICANDO ===');
      console.log('fechaStr:', fechaStr);
      console.log('timestampStr:', timestampStr);
      console.log('datosAVerificar:', datosAVerificar);

      const firmaValida = t.firma && t.usuario?.clave_publica
        ? this.aesService.verificar(datosAVerificar, t.firma, t.usuario.clave_publica)
        : false;

      console.log('firmaValida:', firmaValida);

      return {
        id_tarjeta: t.id_tarjeta,
        ...datos,
        fecha_expiracion: fechaStr,
        firma_valida: firmaValida,
        firma: t.firma ? t.firma.substring(0, 50) + '...' : null,
      };
    });
  }
}