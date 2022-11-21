import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { ClientProxySmartRanking } from 'src/proxyrmq/client-proxy';
import { ChallengeStatus } from './challenge-status.enum';
import { Challenge } from './interfaces/challenge.interface';
import * as momentTimezone from 'moment-timezone';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectModel('Challenge') private readonly challengeModel: Model<Challenge>,
    private clientProxySmartRanking: ClientProxySmartRanking,
  ) {}

  private readonly logger = new Logger(ChallengesService.name);

  private clientNotifications =
    this.clientProxySmartRanking.getClientProxyNotificationsInstance();

  async createChallenge(challenge: Challenge): Promise<Challenge> {
    try {
      const createdChallenge = new this.challengeModel(challenge);
      createdChallenge.solicitationDate = new Date();
      /*
            Quando um desafio for criado, definimos o status 
            desafio como pendente
        */
      createdChallenge.status = ChallengeStatus.PENDING;
      this.logger.log(`createdChallenge: ${JSON.stringify(createdChallenge)}`);
      /*
            Adequação para contemplar o envio do desafio para o 
            microservice notificações
        */
      await createdChallenge.save();

      return await lastValueFrom(
        this.clientNotifications.emit('new-challenge-notification', challenge),
      );
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }

  async getChallenges(): Promise<Challenge[]> {
    try {
      return await this.challengeModel.find().exec();
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }

  async getPlayerChallenges(_id: any): Promise<Challenge[] | Challenge> {
    try {
      return await this.challengeModel.find().where('players').in(_id).exec();
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }

  async getChallengeById(_id: any): Promise<Challenge> {
    try {
      return await this.challengeModel.findOne({ _id }).exec();
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }

  async getDoneChallenges(categoryId: string): Promise<Challenge[]> {
    try {
      return await this.challengeModel
        .find()
        .where('category')
        .equals(categoryId)
        .where('status')
        .equals(ChallengeStatus.DONE)
        .exec();
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }

  async getDoneChallengesByDate(
    categoryId: string,
    dateRef: string,
  ): Promise<Challenge[]> {
    try {
      const dateRefNew = `${dateRef} 23:59:59.999`;

      return await this.challengeModel
        .find()
        .where('category')
        .equals(categoryId)
        .where('status')
        .equals(ChallengeStatus.DONE)
        .where('dateChallenge')
        .lte(
          new Date(
            momentTimezone(dateRefNew)
              .tz('UTC')
              .format('YYYY-MM-DD HH:mm:ss.SSS+00:00'),
          ).getTime(),
        )
        .exec();
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }

  async updateChallenge(_id: string, challenge: Challenge): Promise<Challenge> {
    try {
      /*
            Atualizaremos a data da resposta quando o status do desafio 
            vier preenchido 
        */
      challenge.answerDate = new Date();
      return await this.challengeModel
        .findOneAndUpdate({ _id }, { $set: challenge })
        .exec();
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }

  async updateChallengePlay(
    playId: string,
    challenge: Challenge,
  ): Promise<Challenge> {
    try {
      /*
            Quando uma partida for registrada por um usuário, mudaremos o 
            status do desafio para realizado
        */
      challenge.status = ChallengeStatus.DONE;
      challenge.play = playId;
      return await this.challengeModel
        .findOneAndUpdate({ _id: challenge._id }, { $set: challenge })
        .exec();
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }

  async deleteChallenge(challenge: Challenge): Promise<void> {
    try {
      const { _id } = challenge;
      /*
              Realizaremos a deleção lógica do desafio, modificando seu status para
              CANCELADO
          */
      challenge.status = ChallengeStatus.CANCELED;
      this.logger.log(`challenge: ${JSON.stringify(challenge)}`);
      await this.challengeModel
        .findOneAndUpdate({ _id }, { $set: challenge })
        .exec();
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }
}
