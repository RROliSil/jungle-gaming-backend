import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  @IsNotEmpty({ message: 'O username é obrigatório' })
  username!: string;

  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}

export class UpdatePlayerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}
