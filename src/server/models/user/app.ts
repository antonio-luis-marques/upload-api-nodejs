import { Document, Schema, model } from "mongoose";

interface IUser extends Document {
  username: string;
  password: string;
  avatarUrl?: string;
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    avatarUrl: { type: String, required: false },
  },
  { timestamps: true }
);

const UserModel = model<IUser>("User", UserSchema);
export default UserModel;
