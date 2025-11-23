import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import * as bcrypt from 'bcryptjs';
import { genSalt } from '../crypto/crypto.util';
import { JwtService } from '@nestjs/jwt';
import { AesService } from '../crypto/aes.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private userRepo: Repository<Usuario>,
    private jwtService: JwtService,
    private aesService: AesService, // INYECTAR
  ) {}

  /**
   * Registro seguro:
   * - Genera hash con bcrypt
   * - Genera salt para Zero Knowledge (32 bytes)
   * - Genera par de llaves RSA para firma digital
   * - Cifra clave privada con password del usuario
   * - Guarda todo
   */
  async register(nombre: string, correo: string, password: string) {
    // 1) Salt de bcrypt
    const bcryptSalt = await bcrypt.genSalt(10);
    const bcryptHash = await bcrypt.hash(password, bcryptSalt);

    // 2) Salt para Zero Knowledge (derivar AES key luego)
    const zkSalt = genSalt(32); // buffer

    // 3) GENERAR PAR DE LLAVES RSA PARA FIRMA DIGITAL
    const { publicKey, privateKey } = this.aesService.generarParLlaves();

    // 4) CIFRAR CLAVE PRIVADA CON PASSWORD DEL USUARIO
    const clavePrivadaCifrada = this.aesService.cifrarClavePrivada(
      privateKey,
      password,
      zkSalt
    );

    const user = this.userRepo.create({
      nombre_completo: nombre,
      correo,
      contrasena_hash: bcryptHash,
      salt: zkSalt,
      clave_publica: publicKey,
      clave_privada_cifrada: clavePrivadaCifrada,
    });

    const saved = await this.userRepo.save(user);

    return {
      id_usuario: saved.id_usuario,
      salt: zkSalt.toString('base64'), // cliente deriva key
      clave_publica: publicKey, // Retornar para info
      mensaje: 'Usuario registrado con éxito. Par de llaves RSA generado para firma digital.',
    };
  }

  /**
   * Validación de login
   */
  async validateUser(correo: string, password: string) {
    const user = await this.userRepo.findOne({ where: { correo } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const ok = await bcrypt.compare(password, user.contrasena_hash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    return user;
  }

  /**
   * Emisión del JWT
   */
  async login(user: Usuario) {
    const payload = { sub: user.id_usuario, email: user.correo };
    return {
      access_token: this.jwtService.sign(payload),
      salt: user.salt.toString('base64'), // Para derivación en cliente
    };
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id: number): Promise<Usuario> {
    const user = await this.userRepo.findOne({ where: { id_usuario: id } });
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    
    return user;
  }
}