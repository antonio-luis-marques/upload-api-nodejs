import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import UserModel from "../../models/user/app";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

const fileSizeLimit = 2 * 1024 * 1024; // Limite de 2MB

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

const uploadMiddleware = upload.single("avatar");

const uploadAvatar = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "user-avatars" },
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

const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Os campos username e password são obrigatórios." });
      return;
    }

    // Verificar se o usuário já existe
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      res.status(400).json({ error: "O nome de usuário já está em uso." });
      return;
    }

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(password, 10);

    let avatarUrl;
    if (req.file) {
      avatarUrl = await uploadAvatar(req.file);
    }

    // Criar usuário
    const newUser = new UserModel({
      username,
      password: hashedPassword,
      avatarUrl,
    });

    await newUser.save();

    res.status(201).json({
      message: "Usuário criado com sucesso!",
      user: { username: newUser.username, avatarUrl: newUser.avatarUrl },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar usuário. Tente novamente mais tarde." });
  }
};

export { uploadMiddleware, createUser };
