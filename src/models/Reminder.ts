import mongoose, { Document, Schema } from 'mongoose';

export interface IReminder extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  content?: string;
  date: Date;
}

const ReminderSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String },
  date: { type: Date },
}, {
  timestamps: true
});

export default mongoose.model<IReminder>('Reminder', ReminderSchema);
