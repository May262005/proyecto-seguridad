import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tarjeta } from './tarjeta.entity';
import { TarjetasController } from './tarjetas.controller';
import { TarjetasService } from './tarjetas.service';
import { AesService } from '../crypto/aes.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Usuario } from 'src/usuarios/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tarjeta, Usuario]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'TuJWTSecretMuySecreto',
      signOptions: { expiresIn: Number(process.env.JWT_EXP) || 3600 },
    }),
  ],
  controllers: [TarjetasController],
  providers: [TarjetasService, AesService, JwtStrategy],
})
export class TarjetasModule {}
