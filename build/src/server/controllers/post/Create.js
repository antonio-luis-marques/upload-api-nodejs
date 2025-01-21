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
const ironpdf_1 = require("@ironsoftware/ironpdf");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
});
const fileSizeLimit = 10 * 1024 * 1024; // Aumentado para suportar PDFs maiores
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
// Função para processar PDFs e gerar capa
const processPdf = (fileBuffer) => __awaiter(void 0, void 0, void 0, function* () {
    const tempPdfPath = path_1.default.join(__dirname, "temp.pdf");
    const tempImagePath = path_1.default.join(__dirname, "temp-page.jpg");
    // Salvar PDF temporariamente
    yield promises_1.default.writeFile(tempPdfPath, fileBuffer);
    try {
        const pdf = yield ironpdf_1.PdfDocument.fromFile(tempPdfPath);
        // Gerar imagem da primeira página
        yield pdf.rasterizeToImageFiles(tempImagePath, {
            type: ironpdf_1.ImageType.JPG,
            fromPages: [0],
        });
        const pdfUrl = yield uploadToCloudinary(fileBuffer, "post-pdfs", "raw");
        const coverImageBuffer = yield promises_1.default.readFile(tempImagePath);
        const coverImageUrl = yield uploadToCloudinary(coverImageBuffer, "post-images", "image");
        return { pdfUrl, coverImageUrl };
    }
    finally {
        // Limpar arquivos temporários
        yield promises_1.default.unlink(tempPdfPath).catch(() => { });
        yield promises_1.default.unlink(tempImagePath).catch(() => { });
    }
});
// Função para processar os arquivos de pergunta e resposta
const processFiles = (files, folder, isQuestion) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
        if (file.mimetype === "application/pdf") {
            const { pdfUrl, coverImageUrl } = yield processPdf(file.buffer);
            return isQuestion
                ? { original: pdfUrl, cover: coverImageUrl }
                : { original: pdfUrl, cover: coverImageUrl };
        }
        else {
            const imageUrl = yield uploadToCloudinary(file.buffer, folder, "image");
            return isQuestion
                ? { original: imageUrl, cover: imageUrl }
                : { original: imageUrl, cover: imageUrl };
        }
    })));
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
            res.status(400).json({ error: "Imagem(s) ou PDF(s) da pergunta são obrigatórios." });
            return;
        }
        const fileQuestionUrls = yield processFiles(fileQuestion, "post-images", true);
        const data = {
            subject,
            questionTitle,
            questionDescription,
            fileQuestionUrls,
        };
        if (answerTitle || answerDescription || (fileAnswer && fileAnswer.length > 0)) {
            const fileAnswerUrls = fileAnswer ? yield processFiles(fileAnswer, "post-images", false) : [];
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
