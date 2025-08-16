import mongoose, { Document, Schema } from 'mongoose';

export enum ExpenseCategory {
  SUPERMERCADO = 'Supermercado',
  ALUGUEL = 'Aluguel',
  COMBUSTIVEL = 'Combustível',
  BOLLETOS = 'Boletos',
  SAUDE = 'Saúde',
  EDUCACAO = 'Educação',
  LAZER = 'Lazer',
  DOACAO = 'Doação',
  INTERNET = 'Internet',
  STREAMING = 'Streaming',
  TELEFONE = 'Telefone',
  OUTROS = 'Outros',
}

export interface IExpense extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  value: number;
  category: ExpenseCategory;
  description?: string;
  date: Date;
}

const ExpenseSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  value: { type: Number, required: true },
  category: {
    type: String,
    enum: Object.values(ExpenseCategory),
    required: true
  },
  description: { type: String },
  date: { type: Date, required: true },
});

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
