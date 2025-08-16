import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String, unique: true,
    required: [true, 'Nome é obrigatório'],
    trim: true,
  }
}, {
  timestamps: true // Adiciona automaticamente createdAt e updatedAt
});

export default mongoose.model<IUser>('User', UserSchema);
