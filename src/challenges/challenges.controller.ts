import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { ChallengesService } from './challenges.service';
import { Challenge } from './interfaces/challenge.interface';

const ackErrors: string[] = ['E11000'];

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  private readonly logger = new Logger(ChallengesController.name);

  @EventPattern('create-challenge')
  async createChallenge(
    @Payload() challenge: Challenge,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      this.logger.log(`challenge: ${JSON.stringify(challenge)}`);
      await this.challengesService.createChallenge(challenge);
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

  @MessagePattern('get-challenges')
  async getChallenges(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ): Promise<Challenge[] | Challenge> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      const { playerId, _id } = data;
      this.logger.log(`data: ${JSON.stringify(data)}`);
      if (playerId) {
        return await this.challengesService.getPlayerChallenges(playerId);
      } else if (_id) {
        return await this.challengesService.getChallengeById(_id);
      } else {
        return await this.challengesService.getChallenges();
      }
    } finally {
      await channel.ack(originalMsg);
    }
  }

  @MessagePattern('get-done-challenges')
  async getDoneChallenges(
    @Payload() payload: any,
    @Ctx() context: RmqContext,
  ): Promise<Challenge[] | Challenge> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      const { categoryId, dateRef } = payload;
      this.logger.log(`data: ${JSON.stringify(payload)}`);
      if (dateRef) {
        return await this.challengesService.getDoneChallengesByDate(
          categoryId,
          dateRef,
        );
      } else {
        return await this.challengesService.getDoneChallenges(categoryId);
      }
    } finally {
      await channel.ack(originalMsg);
    }
  }

  @EventPattern('update-challenge')
  async updateChallenge(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      this.logger.log(`data: ${JSON.stringify(data)}`);
      const _id: string = data.id;
      const challenge: Challenge = data.challenge;
      await this.challengesService.updateChallenge(_id, challenge);
      await channel.ack(originalMsg);
    } catch (error) {
      const filterAckError = ackErrors.filter((ackError) =>
        error.message.includes(ackError),
      );
      if (filterAckError.length > 0) {
        await channel.ack(originalMsg);
      }
    }
  }

  @EventPattern('update-challenge-play')
  async updateChallengePlay(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      this.logger.log(`data: ${JSON.stringify(data)}`);
      const playId: string = data.playId;
      const challenge: Challenge = data.challenge;
      await this.challengesService.updateChallengePlay(playId, challenge);
      await channel.ack(originalMsg);
    } catch (error) {
      const filterAckError = ackErrors.filter((ackError) =>
        error.message.includes(ackError),
      );
      if (filterAckError.length > 0) {
        await channel.ack(originalMsg);
      }
    }
  }

  @EventPattern('delete-challenge')
  async deleteChallenge(
    @Payload() challenge: Challenge,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.challengesService.deleteChallenge(challenge);
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
