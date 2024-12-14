"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.uploadMiddleware = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const app_1 = __importDefault(require("../../models/user/app"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
});
const fileSizeLimit = 2 * 1024 * 1024; // Limite de 2MB
const upload = (0, multer_1.default)({
    limits: { fileSize: fileSizeLimit },
    storage: multer_1.default.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Somente arquivos de imagem são permitidos!"));
        }
        cb(null, true);
    },
});
const uploadMiddleware = upload.single("avatar");
exports.uploadMiddleware = uploadMiddleware;
const uploadAvatar = (file) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({ resource_type: "image", folder: "user-avatars" }, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve((result === null || result === void 0 ? void 0 : result.secure_url) || "");
            }
        });
        stream.end(file.buffer);
    });
});
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: "Os campos username e password são obrigatórios." });
            return;
        }
        // Verificar se o usuário já existe
        const existingUser = yield app_1.default.findOne({ username });
        if (existingUser) {
            res.status(400).json({ error: "O nome de usuário já está em uso." });
            return;
        }
        // Criptografar senha
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        let avatarUrl;
        if (req.file) {
            avatarUrl = yield uploadAvatar(req.file);
        }
        // Criar usuário
        const newUser = new app_1.default({
            username,
            password: hashedPassword,
            avatarUrl,
        });
        yield newUser.save();
        res.status(201).json({
            message: "Usuário criado com sucesso!",
            user: { username: newUser.username, avatarUrl: newUser.avatarUrl },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar usuário. Tente novamente mais tarde." });
    }
});
exports.createUser = createUser;
