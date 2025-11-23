import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Llave } from './llave.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Llave)
    private repo: Repository<Llave>,
  ) {}

  async savePublicKey(
    id_usuario: number,
    public_key: string,
    private_key_enc?: string,
  ) {
    let found = await this.repo.findOne({ where: { id_usuario } });

    if (!found) {
      found = this.repo.create({
        id_usuario,
        public_key,
        private_key_enc: private_key_enc
          ? Buffer.from(private_key_enc, 'base64')
          : null,
      });
    } else {
      found.public_key = public_key;
      found.private_key_enc = private_key_enc
        ? Buffer.from(private_key_enc, 'base64')
        : null;
    }

    return this.repo.save(found);
  }
}
