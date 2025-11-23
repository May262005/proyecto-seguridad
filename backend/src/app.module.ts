import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { TarjetasModule } from './tarjetas/tarjetas.module';
import { HybridModule } from './hybrid/hybrid.module';
import { Usuario } from './usuarios/usuario.entity';
import { Llave } from './usuarios/llave.entity';
import { Tarjeta } from './tarjetas/tarjeta.entity';

// 👉 IMPORTS NUEVOS
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot(),

    // 👉 AGREGAR ESTO ANTES DE TODAS LAS RUTAS
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'fronted'),
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'proyecto_seguridad',
      entities: [Usuario, Llave, Tarjeta],
      synchronize: true, // ok para práctica, NO en prod
    }),

    AuthModule,
    UsuariosModule,
    TarjetasModule,
    HybridModule,
  ],
})
export class AppModule {}
