import { IsNumber, IsPositive, IsString } from 'class-validator';

export class PaymentSessionLineItemDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
