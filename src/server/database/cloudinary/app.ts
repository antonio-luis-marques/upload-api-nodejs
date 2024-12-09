// cloudinaryConnection.ts
import { v2 as cloudinary } from "cloudinary";
import * as dotenv from 'dotenv';


dotenv.config();

// Configuração do Cloudinary usando variáveis de ambiente
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// Função para testar a conexão com o Cloudinary
export const testCloudinaryConnection = async (): Promise<boolean> => {
  try {
    const result = await cloudinary.api.ping();
    console.log("Conexão com Cloudinary bem-sucedida:", result);
    return true;
  } catch (error) {
    console.error("Erro ao conectar ao Cloudinary:", error);
    return false;
  }
};
