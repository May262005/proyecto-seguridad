import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('tarjetas')
export class Tarjeta {
  @PrimaryGeneratedColumn()
  id_tarjeta: number;

  @Column()
  id_usuario: number;

  @Column({ type: 'date' })
  fecha_expiracion: Date;

  @Column({ type: 'blob' })
  iv: Buffer;

  @Column({ type: 'blob' })
  numero_tarjeta: Buffer; // JSON cifrado completo

  @Column({ type: 'blob' })
  ccv: Buffer; // Ya no se usa, mantener vacío

  // NUEVA COLUMNA PARA FIRMA DIGITAL
  @Column({ type: 'text', nullable: true })
  firma: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @ManyToOne(() => Usuario, usuario => usuario.tarjetas)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}