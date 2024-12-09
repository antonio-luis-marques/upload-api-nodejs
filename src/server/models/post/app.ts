import { Document, Schema, model } from "mongoose";

interface IAnswer {
  answerTitle?: string;
  answerDescription?: string;
  fileAnswerUrls?: string[];
}

interface IPost extends Document {
  subject: string;
  questionTitle: string;
  questionDescription: string;
  fileQuestionUrls?: string[];
  answers: IAnswer[];
}

const AnswerSchema: Schema = new Schema<IAnswer>(
  {
    answerTitle: { type: String, required: false },
    answerDescription: { type: String, required: false },
    fileAnswerUrls: { type: [String], required: false },
  },
  { timestamps: true }
);

const PostSchema: Schema = new Schema<IPost>(
  {
    subject: { type: String, required: true },
    questionTitle: { type: String, required: true },
    questionDescription: { type: String, required: true },
    fileQuestionUrls: { type: [String], required: true },
    answers: [AnswerSchema],
  },
  { timestamps: true }
);

const PostModel = model<IPost>("Post", PostSchema);
export default PostModel;

