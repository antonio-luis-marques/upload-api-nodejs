"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Schema para as respostas
const AnswerSchema = new mongoose_1.Schema({
    answerTitle: { type: String, required: false },
    answerDescription: { type: String, required: false },
    fileAnswerUrls: { type: [String], required: false },
}, { timestamps: true });
// Schema para os Posts
const PostSchema = new mongoose_1.Schema({
    subject: { type: String, required: true },
    questionTitle: { type: String, required: true },
    questionDescription: { type: String, required: true },
    fileQuestionUrls: {
        type: [
            {
                original: { type: String, required: true },
                cover: { type: String, required: false },
            },
        ],
        required: false, // Agora é opcional
    },
    answers: [AnswerSchema],
}, { timestamps: true });
// Criação do modelo
const PostModel = (0, mongoose_1.model)("Post", PostSchema);
exports.default = PostModel;
