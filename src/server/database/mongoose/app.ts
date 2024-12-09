import mongoose from "mongoose";
import * as dotenv from 'dotenv';


dotenv.config();

const dbUser = process.env.DB_USER;
const dbPassWord = process.env.DB_PASS;

if (!dbUser || !dbPassWord) {
  console.error("As variáveis de ambiente DB_USER e DB_PASS não estão definidas.");
  process.exit(1);
}

const connectDB = async () => {
  try {
    const mongoURI = `mongodb+srv://${dbUser}:${dbPassWord}@cluster0.l0jjc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    await mongoose.connect(mongoURI);
    console.log("MongoDB conectado com sucesso!");
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
