import { Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import PostModel from "../../models/post/app";
import { PdfDocument, ImageType } from "@ironsoftware/ironpdf";
import path from "path";
import fs from "fs/promises";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

const fileSizeLimit = 10 * 1024 * 1024; // Aumentado para suportar PDFs maiores

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
const uploadToCloudinary = async (buffer: Buffer, folder: string, resourceType: "image" | "raw"): Promise<string> => {
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

// Função para processar PDFs e gerar capa
const processPdf = async (fileBuffer: Buffer): Promise<{ pdfUrl: string; coverImageUrl: string }> => {
  const tempPdfPath = path.join(__dirname, "temp.pdf");
  const tempImagePath = path.join(__dirname, "temp-page.jpg");

  // Salvar PDF temporariamente
  await fs.writeFile(tempPdfPath, fileBuffer);

  try {
    const pdf = await PdfDocument.fromFile(tempPdfPath);

    // Gerar imagem da primeira página
    await pdf.rasterizeToImageFiles(tempImagePath, {
      type: ImageType.JPG,
      fromPages: [0],
    });

    const pdfUrl = await uploadToCloudinary(fileBuffer, "post-pdfs", "raw");
    const coverImageBuffer = await fs.readFile(tempImagePath);
    const coverImageUrl = await uploadToCloudinary(coverImageBuffer, "post-images", "image");

    return { pdfUrl, coverImageUrl };
  } finally {
    // Limpar arquivos temporários
    await fs.unlink(tempPdfPath).catch(() => { });
    await fs.unlink(tempImagePath).catch(() => { });
  }
};

// Função para processar os arquivos de pergunta e resposta
const processFiles = async (files: Express.Multer.File[], folder: string, isQuestion: boolean) => {
  return Promise.all(
    files.map(async (file) => {
      if (file.mimetype === "application/pdf") {
        const { pdfUrl, coverImageUrl } = await processPdf(file.buffer);
        return isQuestion
          ? { original: pdfUrl, cover: coverImageUrl }
          : { original: pdfUrl, cover: coverImageUrl };
      } else {
        const imageUrl = await uploadToCloudinary(file.buffer, folder, "image");
        return isQuestion
          ? { original: imageUrl, cover: imageUrl }
          : { original: imageUrl, cover: imageUrl };
      }
    })
  );
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
      res.status(400).json({ error: "Imagem(s) ou PDF(s) da pergunta são obrigatórios." });
      return;
    }

    const fileQuestionUrls = await processFiles(fileQuestion, "post-images", true);

    const data: Record<string, any> = {
      subject,
      questionTitle,
      questionDescription,
      fileQuestionUrls,
    };

    if (answerTitle || answerDescription || (fileAnswer && fileAnswer.length > 0)) {
      const fileAnswerUrls = fileAnswer ? await processFiles(fileAnswer, "post-images", false) : [];

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