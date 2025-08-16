import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyEntry extends Document {
  valor: number;
  data: Date;
  user: Schema.Types.ObjectId;
}

const EmergencyEntrySchema: Schema = new Schema({
  valor: { type: Number, required: true },
  data: { type: Date, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default mongoose.model<IEmergencyEntry>('EmergencyEntry', EmergencyEntrySchema);
