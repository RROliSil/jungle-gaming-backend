import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto, PlayRoundDto, UpdateGameDto } from './dto/game.dto';
import { GameEngineRegistry } from './engines/game-engine.registry';

/**
 * PASSO 3 & PASSO 4: GamesController
 * Expõe tanto o CRUD REST de jogos quanto a rota de execução de partidas e histórico.
 */
@Controller('games')
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly engineRegistry: GameEngineRegistry,
  ) {}

  // Lista os motores (engines) disponíveis no código
  @Get('engines')
  getRegisteredEngines() {
    return {
      availableSlugs: this.engineRegistry.getAvailableSlugs(),
    };
  }

  // Histórico das últimas partidas (SQL SELECT com JOIN em players e games)
  @Get('rounds/history')
  getRecentRounds(@Query('limit') limit?: string) {
    return this.gamesService.findRecentRounds(limit ? Number(limit) : 20);
  }

  // Remove um registro de partida do histórico (SQL DELETE)
  @Delete('rounds/:roundId')
  deleteRound(@Param('roundId') roundId: string) {
    return this.gamesService.deleteRound(roundId);
  }

  // Executa uma partida via HTTP POST (alternativa ao WebSocket)
  @Post('play')
  playRoundRest(@Body() dto: PlayRoundDto) {
    return this.gamesService.playRound(dto);
  }

  // [C]RUD: POST /games -> SQL INSERT
  @Post()
  create(@Body() dto: CreateGameDto) {
    return this.gamesService.create(dto);
  }

  // C[R]UD: GET /games -> SQL SELECT
  @Get()
  findAll() {
    return this.gamesService.findAll();
  }

  // C[R]UD: GET /games/:id -> SQL SELECT WHERE
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gamesService.findOne(id);
  }

  // CR[U]D: PUT /games/:id -> SQL UPDATE
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGameDto) {
    return this.gamesService.update(id, dto);
  }

  // CRU[D] - DELETE /games/:id -> SQL DELETE
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gamesService.remove(id);
  }
}
