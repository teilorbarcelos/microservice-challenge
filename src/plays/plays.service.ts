import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { Challenge } from 'src/challenges/interfaces/challenge.interface';
import { ClientProxySmartRanking } from 'src/proxyrmq/client-proxy';
import { Play } from './interfaces/play.interface';

@Injectable()
export class PlaysService {
  constructor(
    @InjectModel('Play') private readonly playModel: Model<Play>,
    private clientProxySmartRanking: ClientProxySmartRanking,
  ) {}

  private readonly logger = new Logger(PlaysService.name);

  private clientChallenges =
    this.clientProxySmartRanking.getClientProxyChallengesInstance();

  private clientRankings =
    this.clientProxySmartRanking.getClientProxyRankingsInstance();

  async createPlay(play: Play): Promise<Play> {
    try {
      /*
                Iremos persistir a partida e logo em seguida atualizaremos o
                desafio. O desafio irá receber o ID da partida e seu status
                será modificado para REALIZADO.
            */
      const createdPlay = new this.playModel(play);
      this.logger.log(`createdPlay: ${JSON.stringify(createdPlay)}`);
      /*
                Recuperamos o ID da partida
            */
      const result = await createdPlay.save();
      this.logger.log(`result: ${JSON.stringify(result)}`);
      const playId = result._id;
      /*
                Com o ID do desafio que recebemos na requisição, recuperamos o 
                desafio.
            */
      const challenge: Challenge = await lastValueFrom(
        this.clientChallenges.send('get-challenges', {
          playerId: '',
          _id: play.challenge,
        }),
      );
      /*
                Acionamos o tópico 'atualizar-desafio-partida' que será
                responsável por atualizar o desafio.
            */
      await lastValueFrom(
        this.clientChallenges.emit('update-challenge-play', {
          playId: playId,
          challenge: challenge,
        }),
      );

      /*
                Enviamos a partida para o microservice rankings,
                indicando a necessidade de processamento desta partida
            */
      return await lastValueFrom(
        this.clientRankings.emit('process-play', {
          playId: playId,
          play: play,
        }),
      );
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }
}
