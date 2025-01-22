import mongoose, { Schema, Document } from 'mongoose';

// Definição da interface para o Post
interface IPost extends Document {
  title: string;
  description: string;
  pdfUrl?: string;
  imageUrl?: string;
  createdAt: Date;
}

// Definição do schema para o Post
const postSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Isso irá adicionar `createdAt` e `updatedAt` automaticamente
  }
);

// Criando o modelo do Post com base no schema
const PostModel = mongoose.model<IPost>('Post', postSchema);

export default PostModel;
