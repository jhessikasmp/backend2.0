import mongoose, { Document, Schema } from 'mongoose';

export interface IInvestmentEntry extends Document {
  user: mongoose.Types.ObjectId;
  value: number;
  date: Date; // Data do aporte/entrada
}

const InvestmentEntrySchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true },
  moeda: { type: String, enum: ['Real', 'Dolar', 'Euro'], required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model<IInvestmentEntry>('InvestmentEntry', InvestmentEntrySchema);
