import { Module } from '@nestjs/common';
import { HybridController } from './hybrid.controller';

@Module({
  controllers: [HybridController],
})
export class HybridModule {}
