import mongoose, { Schema, Document } from 'mongoose';

export interface ICarroExpense extends Document {
  nome: string;
  descricao?: string;
  valor: number;
  data: Date;
  user: Schema.Types.ObjectId;
}

const CarroExpenseSchema: Schema = new Schema({
  nome: { type: String, required: true },
  descricao: { type: String },
  valor: { type: Number, required: true },
  data: { type: Date, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default mongoose.model<ICarroExpense>('CarroExpense', CarroExpenseSchema);
