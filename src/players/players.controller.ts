import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto, UpdatePlayerDto } from './dto/player.dto';

/**
 * PASSO 3: PlayersController — Endpoints REST (GET, POST, PUT, DELETE)
 */
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  // POST /players -> Cria jogador (SQL INSERT)
  @Post()
  create(@Body() dto: CreatePlayerDto) {
    return this.playersService.create(dto);
  }

  // GET /players -> Lista todos os jogadores (SQL SELECT)
  @Get()
  findAll() {
    return this.playersService.findAll();
  }

  // GET /players/:id -> Busca 1 jogador pelo ID (SQL SELECT WHERE)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }

  // PUT /players/:id -> Atualiza dados/saldo do jogador (SQL UPDATE)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlayerDto) {
    return this.playersService.update(id, dto);
  }

  // DELETE /players/:id -> Remove jogador do banco (SQL DELETE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playersService.remove(id);
  }
}
