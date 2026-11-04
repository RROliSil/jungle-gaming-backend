import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GamesService } from './games.service';
import { PlayRoundDto } from './dto/game.dto';

/**
 * PASSO 5: GameGateway — Comunicação Bidirecional em Tempo Real com WebSockets (Socket.IO)
 * Essencial para a vaga da Jungle Gaming:
 * "Implementar endpoints REST e fluxos com WebSockets em NestJS com TypeScript"
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GameGateway.name);
  private connectedClients = 0;

  constructor(private readonly gamesService: GamesService) {}

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Cliente conectado via WebSocket: ${client.id} (Total online: ${this.connectedClients})`);
    this.server.emit('online_count', { online: this.connectedClients });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients = Math.max(0, this.connectedClients - 1);
    this.logger.log(`Cliente desconectado: ${client.id} (Total online: ${this.connectedClients})`);
    this.server.emit('online_count', { online: this.connectedClients });
  }

  /**
   * Evento: 'join_game'
   * O cliente entra na sala específica de um jogo (ex: 'room:even-odd')
   */
  @SubscribeMessage('join_game')
  handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameSlug: string; playerId?: string },
  ) {
    const roomName = `room:${data?.gameSlug || 'even-odd'}`;
    client.join(roomName);
    this.logger.log(`Cliente ${client.id} entrou na sala ${roomName}`);

    client.emit('joined_game', {
      room: roomName,
      gameSlug: data?.gameSlug || 'even-odd',
      online: this.connectedClients,
      message: `Conectado em tempo real à sala ${roomName}`,
    });
  }

  /**
   * Evento: 'play_round'
   * Recebe a aposta e a jogada em tempo real via WebSocket, processa no GamesService
   * (transação no PostgreSQL via MikroORM + motor agnóstico) e emite:
   * - 'round_result': resultado individual para quem jogou
   * - 'wallet_updated': novo saldo em tempo real
   * - 'live_bets_feed': broadcast para todos os clientes conectados (Feed Ao Vivo de iGaming)
   */
  @SubscribeMessage('play_round')
  async handlePlayRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PlayRoundDto,
  ) {
    try {
      const result = await this.gamesService.playRound(payload);

      // 1. Devolve o resultado da partida imediatamente para o jogador
      client.emit('round_result', result);

      // 2. Atualiza a carteira (saldo) em tempo real
      client.emit('wallet_updated', {
        playerId: result.player.id,
        previousBalance: result.player.previousBalance,
        newBalance: result.player.newBalance,
      });

      // 3. Broadcast para todos os clientes conectados (Live Feed de Apostas da Plataforma)
      this.server.emit('live_bets_feed', result);

      return { ok: true, roundId: result.roundId };
    } catch (error: any) {
      const message = error?.response?.message || error?.message || 'Erro ao processar a rodada.';
      this.logger.warn(`Erro na jogada via WS (${client.id}): ${message}`);
      client.emit('game_error', {
        error: true,
        message: Array.isArray(message) ? message.join(', ') : message,
      });
      return { ok: false, error: message };
    }
  }
}
