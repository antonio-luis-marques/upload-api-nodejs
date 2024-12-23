import { Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import PostModel from "../../models/post/app";

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

const fileSizeLimit = 50 * 1024 * 1024; // Limite de 50 MB

// Configuração do Multer para upload de arquivos
const upload = multer({
  limits: { fileSize: fileSizeLimit },
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/", "application/pdf"];
    const isValidType = allowedMimeTypes.some((type) => file.mimetype.startsWith(type));

    if (!isValidType) {
      return cb(new Error("Somente arquivos de imagem ou PDF são permitidos!"));
    }
    cb(null, true);
  },
});

const uploadMiddleware = upload.fields([
  { name: "fileQuestion", maxCount: 5 },
  { name: "fileAnswer", maxCount: 5 },
]);

// Função de upload para o Cloudinary
const uploadFileToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const resourceType = file.mimetype.startsWith("image/") ? "image" : "auto"; // PDF tratado como 'auto'
    const folderName = file.mimetype.startsWith("image/") ? "post-images" : "post-pdfs";

    const sanitizedFileName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-") // Substituir caracteres especiais por "-"
      .replace(/-+/g, "-") // Remover múltiplos "-"
      .replace(/^-|-$/g, ""); // Remover "-" no início ou no final

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folderName,
        public_id: sanitizedFileName.replace(/\.[^/.]+$/, ""), // Remove a extensão anterior
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || "");
        }
      }
    );
    stream.end(file.buffer);
  });
};

// Função de criação do post
const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, questionTitle, questionDescription, answerTitle, answerDescription } = req.body;

    if (!subject || !questionTitle || !questionDescription) {
      res.status(400).json({ error: "Os campos subject, questionTitle e questionDescription são obrigatórios." });
      return;
    }

    const { fileQuestion, fileAnswer } = req.files as {
      fileQuestion?: Express.Multer.File[];
      fileAnswer?: Express.Multer.File[];
    };

    if (!fileQuestion || fileQuestion.length === 0) {
      res.status(400).json({ error: "Imagem(s) ou arquivo(s) PDF da pergunta são obrigatórios." });
      return;
    }

    // Fazendo o upload dos arquivos PDF
    const fileQuestionUrls = await Promise.all(fileQuestion.map(uploadFileToCloudinary));

    const data: Record<string, any> = {
      subject,
      questionTitle,
      questionDescription,
      fileQuestionUrls,
    };

    if (answerTitle || answerDescription || (fileAnswer && fileAnswer.length > 0)) {
      const fileAnswerUrls = fileAnswer ? await Promise.all(fileAnswer.map(uploadFileToCloudinary)) : [];

      data.answers = [
        {
          answerTitle: answerTitle || null,
          answerDescription: answerDescription || null,
          fileAnswerUrls,
        },
      ];
    }

    const newPost = new PostModel(data);
    await newPost.save();

    res.status(200).json({
      msg: "Dados recebidos com sucesso!",
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erro interno do servidor. Tente novamente mais tarde." });
  }
};

export { uploadMiddleware, create };