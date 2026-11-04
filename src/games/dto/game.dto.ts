import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  minBet?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxBet?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  payoutMultiplier?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class UpdateGameDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  minBet?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxBet?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  payoutMultiplier?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class PlayRoundDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @IsString()
  @IsNotEmpty()
  gameSlug!: string;

  @IsNumber()
  @IsPositive()
  betAmount!: number;

  @IsObject()
  inputPayload!: Record<string, any>;
}
