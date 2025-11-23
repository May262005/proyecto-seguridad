import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, BeforeInsert } from 'typeorm';
import { Llave } from './llave.entity';
import { Tarjeta } from '../tarjetas/tarjeta.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column({ length: 100 })
  nombre_completo: string;

  @Column({ length: 100, unique: true })
  correo: string;

  @Column({ length: 255 })
  contrasena_hash: string;

  @Column({ type: 'blob' })
  salt: Buffer;

  @Column({ type: 'date' })
  fecha_registro: Date;

  // NUEVAS COLUMNAS PARA FIRMA DIGITAL
  @Column({ type: 'text', nullable: true })
  clave_publica: string;

  @Column({ type: 'text', nullable: true })
  clave_privada_cifrada: string;

  @OneToOne(() => Llave, llave => llave.usuario)
  llave: Llave;

  @OneToMany(() => Tarjeta, tarjeta => tarjeta.usuario)
  tarjetas: Tarjeta[];

  @BeforeInsert()
  setFechaRegistro() {
    if (!this.fecha_registro) {
      this.fecha_registro = new Date();
    }
  }
}