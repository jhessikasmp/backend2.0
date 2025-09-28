import mongoose, { Document, Schema } from 'mongoose';

export interface IInvestmentAnnualReturn extends Document {
  year: number;
  percent: number; // e.g., 12 for 12%
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentAnnualReturnSchema = new Schema<IInvestmentAnnualReturn>({
  year: { type: Number, required: true, unique: true, min: 1900, max: 2200 },
  percent: { type: Number, required: true, min: -1000, max: 10000 },
}, { timestamps: true });

InvestmentAnnualReturnSchema.index({ year: 1 }, { unique: true });

export default mongoose.model<IInvestmentAnnualReturn>('InvestmentAnnualReturn', InvestmentAnnualReturnSchema);
