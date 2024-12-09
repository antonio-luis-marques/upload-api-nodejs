import { Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
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
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Somente arquivos de imagem são permitidos!"));
    }
    cb(null, true);
  },
});

const uploadMiddleware = upload.fields([
  { name: "fileQuestion", maxCount: 5 },
  { name: "fileAnswer", maxCount: 5 },
]);

const uploadFile = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "post-images" },
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
      res.status(400).json({ error: "Imagem(s) da pergunta são obrigatórias." });
      return;
    }

    const fileQuestionUrls = await Promise.all(fileQuestion.map(uploadFile));

    const data: Record<string, any> = {
      subject,
      questionTitle,
      questionDescription,
      fileQuestionUrls,
    };

    if (answerTitle || answerDescription || (fileAnswer && fileAnswer.length > 0)) {
      const fileAnswerUrls = fileAnswer ? await Promise.all(fileAnswer.map(uploadFile)) : [];

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
