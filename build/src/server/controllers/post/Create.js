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
const pdf_lib_1 = require("pdf-lib");
const sharp_1 = __importDefault(require("sharp"));
// Configuração do Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
});
const fileSizeLimit = 50 * 1024 * 1024; // Limite de 50 MB
// Configuração do Multer para upload de arquivos
const upload = (0, multer_1.default)({
    limits: { fileSize: fileSizeLimit },
    storage: multer_1.default.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/", "application/pdf"];
        const isValidType = allowedMimeTypes.some((type) => file.mimetype.startsWith(type));
        if (!isValidType) {
            return cb(new Error("Somente arquivos de imagem ou PDF são permitidos!"));
        }
        cb(null, true);
    },
});
const uploadMiddleware = upload.fields([
    { name: "fileQuestion", maxCount: 5 },
    { name: "fileAnswer", maxCount: 5 },
]);
exports.uploadMiddleware = uploadMiddleware;
// Função de upload para o Cloudinary
const uploadFileToCloudinary = (file) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let buffer = file.buffer;
            if (file.mimetype === "application/pdf") {
                buffer = yield generatePdfCover(file.buffer); // Gera capa
            }
            const folderName = file.mimetype.startsWith("image/") ? "post-images" : "post-pdfs";
            const sanitizedFileName = file.originalname
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");
            const stream = cloudinary_1.v2.uploader.upload_stream({
                resource_type: "image", // Sempre imagem após processar capa
                folder: folderName,
                public_id: sanitizedFileName.replace(/\.[^/.]+$/, ""),
            }, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve((result === null || result === void 0 ? void 0 : result.secure_url) || "");
                }
            });
            stream.end(buffer);
        }
        catch (err) {
            reject(err);
        }
    }));
});
const generatePdfCover = (fileBuffer) => __awaiter(void 0, void 0, void 0, function* () {
    const pdfDoc = yield pdf_lib_1.PDFDocument.load(fileBuffer);
    const page = pdfDoc.getPage(0); // Obtém a primeira página
    const { width, height } = page.getSize();
    const pdfBytes = yield pdfDoc.saveAsBase64({ dataUri: false });
    // Renderiza a imagem da página com Sharp
    const imageBuffer = yield (0, sharp_1.default)(Buffer.from(pdfBytes, "base64"))
        .resize({ width: Math.floor(width), height: Math.floor(height) })
        .png()
        .toBuffer();
    return imageBuffer;
});
// Função de criação do post
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subject, questionTitle, questionDescription, answerTitle, answerDescription } = req.body;
        if (!subject || !questionTitle || !questionDescription) {
            res.status(400).json({ error: "Os campos subject, questionTitle e questionDescription são obrigatórios." });
            return;
        }
        const { fileQuestion, fileAnswer } = req.files;
        if (!fileQuestion || fileQuestion.length === 0) {
            res.status(400).json({ error: "Imagem(s) ou arquivo(s) PDF da pergunta são obrigatórios." });
            return;
        }
        // Fazendo o upload dos arquaaivos PDF
        const fileQuestionUrls = yield Promise.all(fileQuestion.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const originalUrl = yield uploadFileToCloudinary(file);
            // Gera a capa para PDFs
            let coverUrl;
            if (file.mimetype === "application/pdf") {
                const coverBuffer = yield generatePdfCover(file.buffer);
                coverUrl = yield uploadFileToCloudinary(Object.assign(Object.assign({}, file), { buffer: coverBuffer, originalname: `cover-${file.originalname}`, mimetype: "image/png" }));
            }
            return { original: originalUrl, cover: coverUrl };
        })));
        const data = {
            subject,
            questionTitle,
            questionDescription,
            fileQuestionUrls,
        };
        if (answerTitle || answerDescription || (fileAnswer && fileAnswer.length > 0)) {
            const fileAnswerUrls = fileAnswer ? yield Promise.all(fileAnswer.map(uploadFileToCloudinary)) : [];
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
