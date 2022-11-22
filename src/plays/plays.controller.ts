import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Play } from './interfaces/play.interface';
import { PlaysService } from './plays.service';

const ackErrors: string[] = ['E11000'];

@Controller('plays')
export class PlaysController {
  constructor(private readonly playsService: PlaysService) {}

  private readonly logger = new Logger(PlaysController.name);

  @EventPattern('create-play')
  async createPlay(@Payload() play: Play, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      this.logger.log(`play: ${JSON.stringify(play)}`);
      await this.playsService.createPlay(play);
      await channel.ack(originalMsg);
    } catch (error) {
      this.logger.log(`error: ${JSON.stringify(error.message)}`);
      const filterAckError = ackErrors.filter((ackError) =>
        error.message.includes(ackError),
      );
      if (filterAckError.length > 0) {
        await channel.ack(originalMsg);
      }
    }
  }
}
