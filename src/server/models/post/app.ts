import { Document, Schema, model } from "mongoose";

// Interface para as respostas
interface IAnswer {
  answerTitle?: string;
  answerDescription?: string;
  fileAnswerUrls?: string[];
}

// Interface para URLs de arquivos da pergunta
interface IFileQuestionUrl {
  original: string;
  cover?: string | null; // Pode ser string, undefined ou null
}

// Interface para o Post
interface IPost extends Document {
  subject: string;
  questionTitle: string;
  questionDescription: string;
  fileQuestionUrls?: IFileQuestionUrl[]; // Estrutura alterada
  answers: IAnswer[];
}

// Schema para as respostas
const AnswerSchema: Schema = new Schema<IAnswer>(
  {
    answerTitle: { type: String, required: false },
    answerDescription: { type: String, required: false },
    fileAnswerUrls: { type: [String], required: false },
  },
  { timestamps: true }
);

// Schema para os Posts
const PostSchema: Schema = new Schema<IPost>(
  {
    subject: { type: String, required: true },
    questionTitle: { type: String, required: true },
    questionDescription: { type: String, required: true },
    fileQuestionUrls: {
      type: [
        {
          original: { type: String, required: true },
          cover: { type: String, required: false },
        },
      ],
      required: false, // Agora é opcional
    },
    answers: [AnswerSchema],
  },
  { timestamps: true }
);

// Criação do modelo
const PostModel = model<IPost>("Post", PostSchema);
export default PostModel;
