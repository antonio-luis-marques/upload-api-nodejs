import { Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import PostModel from "../../models/post/app";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// Limite de tamanho dos arquivos
const fileSizeLimit = 10 * 1024 * 1024; // 10 MB

// Configuração do Multer
const upload = multer({
  limits: { fileSize: fileSizeLimit },
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/") && file.mimetype !== "application/pdf") {
      return cb(new Error("Somente imagens ou PDFs são permitidos!"));
    }
    cb(null, true);
  },
});

const uploadMiddleware = upload.fields([
  { name: "fileQuestion", maxCount: 5 },
  { name: "fileAnswer", maxCount: 5 },
]);

// Função para enviar arquivo ao Cloudinary
const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "raw"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || "");
        }
      }
    );
    stream.end(buffer);
  });
};

// Processamento de arquivos
const processFiles = async (files: Express.Multer.File[], folder: string) => {
  return Promise.all(
    files.map(async (file) => {
      // Faz upload do arquivo original
      const originalUrl = await uploadToCloudinary(
        file.buffer,
        folder,
        file.mimetype.startsWith("image/") ? "image" : "raw"
      );

      return { original: originalUrl }; // Retorna apenas a URL do arquivo
    })
  );
};

// Controlador para criação de posts
const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      subject,
      questionTitle,
      questionDescription,
      answerTitle,
      answerDescription,
      fileQuestionCovers,
      fileAnswerCovers,
    } = req.body;

    if (!subject || !questionTitle || !questionDescription) {
      res.status(400).json({
        error: "Os campos subject, questionTitle e questionDescription são obrigatórios.",
      });
      return;
    }

    const { fileQuestion, fileAnswer } = req.files as {
      fileQuestion?: Express.Multer.File[];
      fileAnswer?: Express.Multer.File[];
    };

    if (!fileQuestion || fileQuestion.length === 0) {
      res.status(400).json({ error: "Imagem(s) ou PDF(s) da pergunta são obrigatórios." });
      return;
    }

    // Processa os arquivos recebidos
    const fileQuestionUrls = await processFiles(fileQuestion, "post-files");
    const fileAnswerUrls = fileAnswer ? await processFiles(fileAnswer, "post-files") : [];

    // Combina os dados dos arquivos com as capas enviadas (opcionais)
    const processedQuestions = fileQuestionUrls.map((file, index) => ({
      original: file.original,
      cover: fileQuestionCovers?.[index] || null, // Capa opcional
    }));

    const processedAnswers = fileAnswerUrls.map((file, index) => ({
      original: file.original,
      cover: fileAnswerCovers?.[index] || null, // Capa opcional
    }));

    // Dados a serem salvos no banco de dados
    const data: Record<string, any> = {
      subject,
      questionTitle,
      questionDescription,
      fileQuestionUrls: processedQuestions,
    };

    if (answerTitle || answerDescription || processedAnswers.length > 0) {
      data.answers = [
        {
          answerTitle: answerTitle || null,
          answerDescription: answerDescription || null,
          fileAnswerUrls: processedAnswers,
        },
      ];
    }

    const newPost = new PostModel(data);
    await newPost.save();

    res.status(201).json({ message: "Post criado com sucesso!", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar o post." });
  }
};

export { uploadMiddleware, create };
