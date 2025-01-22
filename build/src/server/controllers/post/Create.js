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
exports.create = exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const app_1 = __importDefault(require("../../models/post/app"));
// Configuração do Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
});
// Limite de tamanho dos arquivos
const fileSizeLimit = 10 * 1024 * 1024; // 10 MB
// Configuração do Multer
const upload = (0, multer_1.default)({
    limits: { fileSize: fileSizeLimit },
    storage: multer_1.default.memoryStorage(),
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
exports.uploadMiddleware = uploadMiddleware;
// Função para enviar arquivo ao Cloudinary
const uploadToCloudinary = (buffer, folder, resourceType) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({ folder, resource_type: resourceType }, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve((result === null || result === void 0 ? void 0 : result.secure_url) || "");
            }
        });
        stream.end(buffer);
    });
});
// Controlador para criação de posts
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description } = req.body;
        const { pdfFile, imageFile } = req.files;
        // Enviar arquivo para o Cloudinary
        let pdfUrl = null;
        let imageUrl = null;
        if (pdfFile && pdfFile[0]) {
            pdfUrl = yield uploadToCloudinary(pdfFile[0].buffer, "post-files", "raw");
        }
        if (imageFile && imageFile[0]) {
            imageUrl = yield uploadToCloudinary(imageFile[0].buffer, "post-files", "image");
        }
        // Salvar os dados no MongoDB
        const newPost = new app_1.default({
            title,
            description,
            pdfUrl,
            imageUrl,
        });
        yield newPost.save();
        res.status(201).json({ message: "Post criado com sucesso!" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar o post." });
    }
});
exports.create = create;
