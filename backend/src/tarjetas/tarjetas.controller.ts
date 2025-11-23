import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { TarjetasService } from './tarjetas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tarjetas')
export class TarjetasController {
  constructor(private svc: TarjetasService) {}

  @UseGuards(JwtAuthGuard)
  @Post('guardar')
  async guardar(@Body() body: any, @Request() req: any) {
    const userId = req.user.sub;

    // body = { payload_encrypted, iv, fecha_expiracion, password }
    // El password es necesario para descifrar la clave privada y firmar
    return this.svc.guardar(userId, body);
  }

  /**
   * DEMO: Descifrado en servidor usando la clave derivada enviada por el cliente
   * (Solo para pruebas, no se hace esto en producción).
   * Ahora también verifica las firmas digitales.
   */
  @UseGuards(JwtAuthGuard)
  @Post('descifrar')
  async descifrar(
    @Body() body: { derivedKeyBase64: string },
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.svc.obtenerYDescifrar(userId, body.derivedKeyBase64);
  }

  // Ruta opcional para ver datos crudos en la BD + verificación de firmas
  @UseGuards(JwtAuthGuard)
  @Get('raw')
  async raw(@Request() req: any) {
    const userId = req.user.sub;
    return this.svc.obtenerYCifrarParaUsuario(userId);
  }
}