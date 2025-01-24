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

// Middleware de upload de arquivos
const uploadMiddleware = upload.fields([
  { name: "pdfFile", maxCount: 1 },
  { name: "imageFile", maxCount: 1 },
]);

// Função para enviar arquivo ao Cloudinary
const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "auto"
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

// Controlador para criação de posts
const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    const { pdfFile, imageFile } = req.files as { pdfFile?: Express.Multer.File[]; imageFile?: Express.Multer.File[] };

    // Enviar arquivo para o Cloudinary
    let pdfUrl = null;
    let imageUrl = null;

    if (pdfFile && pdfFile[0]) {
      pdfUrl = await uploadToCloudinary(pdfFile[0].buffer, "post-files", "auto");
    }

    if (imageFile && imageFile[0]) {
      imageUrl = await uploadToCloudinary(imageFile[0].buffer, "post-files", "image");
    }

    // Salvar os dados no MongoDB
    const newPost = new PostModel({
      title,
      description,
      pdfUrl,
      imageUrl,
    });

    await newPost.save();

    res.status(201).json({ message: "Post criado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar o post." });
  }
};

export { uploadMiddleware, create };
