import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChallengesModule } from './challenges/challenges.module';
import { PlaysModule } from './plays/plays.module';

const configService = new ConfigService();
const DB_URL = configService.get<string>('DB_URL');

@Module({
  imports: [
    MongooseModule.forRoot(DB_URL, {
      // useNewUrlParses: true,
      // useCreateIndex: true,
      useUnifiedTopology: true,
      // useFindAndModify: false,
    }),
    ChallengesModule,
    PlaysModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})
export class AppModule {}
