import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private svc: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { nombre: string; correo: string; password: string },
  ) {
    return await this.svc.register(body.nombre, body.correo, body.password);
  }

  @Post('login')
  async login(@Body() body: { correo: string; password: string }) {
    const u = await this.svc.validateUser(body.correo, body.password);
    return this.svc.login(u);
  }
}
