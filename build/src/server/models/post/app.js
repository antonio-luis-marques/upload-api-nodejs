"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AnswerSchema = new mongoose_1.Schema({
    answerTitle: { type: String, required: false },
    answerDescription: { type: String, required: false },
    fileAnswerUrls: { type: [String], required: false },
}, { timestamps: true });
const PostSchema = new mongoose_1.Schema({
    subject: { type: String, required: true },
    questionTitle: { type: String, required: true },
    questionDescription: { type: String, required: true },
    fileQuestionUrls: { type: [String], required: true },
    answers: [AnswerSchema],
}, { timestamps: true });
const PostModel = (0, mongoose_1.model)("Post", PostSchema);
exports.default = PostModel;
