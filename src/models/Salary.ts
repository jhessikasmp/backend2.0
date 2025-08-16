import mongoose, { Document, Schema } from 'mongoose';

export interface ISalary extends Document {
  user: mongoose.Types.ObjectId;
  value: number;
  date: Date;
}

const SalarySchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true },
});

export default mongoose.model<ISalary>('Salary', SalarySchema);
