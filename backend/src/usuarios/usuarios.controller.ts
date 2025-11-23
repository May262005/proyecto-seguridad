import { Controller, Post, Body } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private svc: UsuariosService) {}

  @Post('upload-public')
  async upload(@Body() body: { id_usuario: number; public_key: string; private_key_enc?: string }) {
    return this.svc.savePublicKey(body.id_usuario, body.public_key, body.private_key_enc);
  }
}
