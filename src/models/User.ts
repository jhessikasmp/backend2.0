import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String, unique: true,
    required: [true, 'Nome é obrigatório'],
    trim: true,
  },
  email: {
    type: String,
    required: false,
    trim: true,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true // Adiciona automaticamente createdAt e updatedAt
});

export default mongoose.model<IUser>('User', UserSchema);
