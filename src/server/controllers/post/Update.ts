import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import PostModel from "../../models/post/app";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

const fileSizeLimit = 5 * 1024 * 1024;

const upload = multer({
  limits: { fileSize: fileSizeLimit },
  storage: multer.memoryStorage(),
});

// Função para upload ao Cloudinary
const uploadFile = async (file: Express.Multer.File): Promise<string> => {
  try {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: "answers" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result?.secure_url || "");
        }
      );
      stream.end(file.buffer);
    });
  } catch (error) {
    throw new Error(`Erro ao fazer upload para o Cloudinary: ${error}`);
  }
};


export const uploadMiddlewareUpdate = upload.fields([
  { name: "fileAnswer", maxCount: 5 },
]);

// Adicionar resposta a uma questão existente
const addAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { answerTitle, answerDescription } = req.body;

    if (!id) {
      res.status(400).json({ msg: "O ID da questão é obrigatório." });
      return;
    }

    const questionPost = await PostModel.findById(id);
    if (!questionPost) {
      res.status(404).json({ msg: "Questão não encontrada." });
      return;
    }

    // Processar uploads
    const { fileAnswer } = req.files as { fileAnswer?: Express.Multer.File[] };
    const fileAnswerUrls = fileAnswer
      ? await Promise.all(fileAnswer.map(uploadFile))
      : [];

    // Criar nova resposta
    const newAnswer = {
      answerTitle,
      answerDescription,
      fileAnswerUrls,
    };

    // Adicionar resposta ao array
    questionPost.answers.push(newAnswer);

    // Salvar no banco
    await questionPost.save();

    res.status(200).json({
      msg: "Resposta adicionada com sucesso!",
      data: {
        questionId: questionPost._id,
        answers: questionPost.answers,
      },
    });
  } catch (error) {
    console.error("Erro ao adicionar resposta:", error);

    if (error instanceof Error) {
      res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
    } else {
      res.status(500).json({ msg: "Erro desconhecido no servidor" });
    }
  }
};


export { addAnswer };
