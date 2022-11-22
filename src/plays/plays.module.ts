import { Module } from '@nestjs/common';
import { PlaysService } from './plays.service';
import { PlaysController } from './plays.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProxyRMQModule } from 'src/proxyrmq/proxyrmq.module';
import { PlaySchema } from './interfaces/play.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Play', schema: PlaySchema }]),
    ProxyRMQModule,
  ],
  controllers: [PlaysController],
  providers: [PlaysService],
})
export class PlaysModule {}
