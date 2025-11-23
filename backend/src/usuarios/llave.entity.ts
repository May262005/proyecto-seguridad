import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('llaves')
export class Llave {
  @PrimaryColumn()
  id_usuario: number;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ type: 'text' })
  public_key: string;

  @Column({ type: 'blob', nullable: true })
  private_key_enc: Buffer | null;
}
