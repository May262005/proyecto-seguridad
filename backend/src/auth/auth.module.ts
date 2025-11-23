import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AesService } from '../crypto/aes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'TuJWTSecretMuySecreto',
      signOptions: { expiresIn: Number(process.env.JWT_EXP) || 3600 },
    }),
  ],
  providers: [AuthService, JwtStrategy, AesService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
