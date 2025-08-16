import mongoose, { Document, Schema } from 'mongoose';

export enum InvestmentType {
  ETF = 'ETF',
  CRYPTOMOEDA = 'Cryptomoedas',
  FUNDOS = 'Fundos',
  RENDA_FIXA = 'Renda Fixa',
  ACOES = 'Acoes',
}

export enum CurrencyType {
  EURO = 'Euro',
  DOLAR = 'Dolar',
  REAL = 'Real',
}

export interface IInvestment extends Document {
  user: mongoose.Types.ObjectId;
  nome: string;
  tipo: InvestmentType;
  valor: number;
  moeda: CurrencyType;
  data: Date;
}

const InvestmentSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  nome: { type: String, required: true },
  tipo: { type: String, enum: Object.values(InvestmentType), required: true },
  valor: { type: Number, required: true },
  moeda: { type: String, enum: Object.values(CurrencyType), required: true },
  data: { type: Date, required: true },
});

export default mongoose.model<IInvestment>('Investment', InvestmentSchema);
