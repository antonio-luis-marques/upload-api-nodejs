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
const uploadMiddleware = upload.fields([
    { name: "fileQuestion", maxCount: 5 },
    { name: "fileAnswer", maxCount: 5 },
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
// Processamento de arquivos
const processFiles = (files, folder) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
        // Faz upload do arquivo original
        const originalUrl = yield uploadToCloudinary(file.buffer, folder, file.mimetype.startsWith("image/") ? "image" : "raw");
        return { original: originalUrl }; // Retorna apenas a URL do arquivo
    })));
});
// Controlador para criação de posts
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subject, questionTitle, questionDescription, answerTitle, answerDescription, fileQuestionCovers, fileAnswerCovers, } = req.body;
        if (!subject || !questionTitle || !questionDescription) {
            res.status(400).json({
                error: "Os campos subject, questionTitle e questionDescription são obrigatórios.",
            });
            return;
        }
        const { fileQuestion, fileAnswer } = req.files;
        if (!fileQuestion || fileQuestion.length === 0) {
            res.status(400).json({ error: "Imagem(s) ou PDF(s) da pergunta são obrigatórios." });
            return;
        }
        // Processa os arquivos recebidos
        const fileQuestionUrls = yield processFiles(fileQuestion, "post-files");
        const fileAnswerUrls = fileAnswer ? yield processFiles(fileAnswer, "post-files") : [];
        // Combina os dados dos arquivos com as capas enviadas (opcionais)
        const processedQuestions = fileQuestionUrls.map((file, index) => ({
            original: file.original,
            cover: (fileQuestionCovers === null || fileQuestionCovers === void 0 ? void 0 : fileQuestionCovers[index]) || null, // Capa opcional
        }));
        const processedAnswers = fileAnswerUrls.map((file, index) => ({
            original: file.original,
            cover: (fileAnswerCovers === null || fileAnswerCovers === void 0 ? void 0 : fileAnswerCovers[index]) || null, // Capa opcional
        }));
        // Dados a serem salvos no banco de dados
        const data = {
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
        const newPost = new app_1.default(data);
        yield newPost.save();
        res.status(201).json({ message: "Post criado com sucesso!", data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar o post." });
    }
});
exports.create = create;
