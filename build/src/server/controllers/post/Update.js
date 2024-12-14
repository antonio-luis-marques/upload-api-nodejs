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
exports.addAnswer = exports.uploadMiddlewareUpdate = void 0;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const app_1 = __importDefault(require("../../models/post/app"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
});
const fileSizeLimit = 5 * 1024 * 1024;
const upload = (0, multer_1.default)({
    limits: { fileSize: fileSizeLimit },
    storage: multer_1.default.memoryStorage(),
});
// Função para upload ao Cloudinary
const uploadFile = (file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({ resource_type: "image", folder: "answers" }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve((result === null || result === void 0 ? void 0 : result.secure_url) || "");
            });
            stream.end(file.buffer);
        });
    }
    catch (error) {
        throw new Error(`Erro ao fazer upload para o Cloudinary: ${error}`);
    }
});
exports.uploadMiddlewareUpdate = upload.fields([
    { name: "fileAnswer", maxCount: 5 },
]);
// Adicionar resposta a uma questão existente
const addAnswer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { answerTitle, answerDescription } = req.body;
        if (!id) {
            res.status(400).json({ msg: "O ID da questão é obrigatório." });
            return;
        }
        const questionPost = yield app_1.default.findById(id);
        if (!questionPost) {
            res.status(404).json({ msg: "Questão não encontrada." });
            return;
        }
        // Processar uploads
        const { fileAnswer } = req.files;
        const fileAnswerUrls = fileAnswer
            ? yield Promise.all(fileAnswer.map(uploadFile))
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
        yield questionPost.save();
        res.status(200).json({
            msg: "Resposta adicionada com sucesso!",
            data: {
                questionId: questionPost._id,
                answers: questionPost.answers,
            },
        });
    }
    catch (error) {
        console.error("Erro ao adicionar resposta:", error);
        if (error instanceof Error) {
            res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
        }
        else {
            res.status(500).json({ msg: "Erro desconhecido no servidor" });
        }
    }
});
exports.addAnswer = addAnswer;
