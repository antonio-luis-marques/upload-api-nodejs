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
const fileSizeLimit = 5 * 1024 * 1024;
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
const uploadMiddleware = upload.fields([
    { name: "fileQuestion", maxCount: 5 },
    { name: "fileAnswer", maxCount: 5 },
]);
exports.uploadMiddleware = uploadMiddleware;
const uploadFile = (file) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({ resource_type: "image", folder: "post-images" }, (error, result) => {
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
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subject, questionTitle, questionDescription, answerTitle, answerDescription } = req.body;
        if (!subject || !questionTitle || !questionDescription) {
            res.status(400).json({ error: "Os campos subject, questionTitle e questionDescription são obrigatórios." });
            return;
        }
        const { fileQuestion, fileAnswer } = req.files;
        if (!fileQuestion || fileQuestion.length === 0) {
            res.status(400).json({ error: "Imagem(s) da pergunta são obrigatórias." });
            return;
        }
        const fileQuestionUrls = yield Promise.all(fileQuestion.map(uploadFile));
        const data = {
            subject,
            questionTitle,
            questionDescription,
            fileQuestionUrls,
        };
        if (answerTitle || answerDescription || (fileAnswer && fileAnswer.length > 0)) {
            const fileAnswerUrls = fileAnswer ? yield Promise.all(fileAnswer.map(uploadFile)) : [];
            data.answers = [
                {
                    answerTitle: answerTitle || null,
                    answerDescription: answerDescription || null,
                    fileAnswerUrls,
                },
            ];
        }
        const newPost = new app_1.default(data);
        yield newPost.save();
        res.status(200).json({
            msg: "Dados recebidos com sucesso!",
            data,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro interno do servidor. Tente novamente mais tarde." });
    }
});
exports.create = create;
