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
exports.getSubject = void 0;
const app_1 = __importDefault(require("../../models/post/app"));
const getSubject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Obtém todos os posts do banco de dados
        const posts = yield app_1.default.find();
        // Retorna os posts no formato JSON
        res.status(200).json({
            msg: "Posts recuperados com sucesso!",
            data: posts,
        });
    }
    catch (error) {
        console.error(error);
        if (error instanceof Error) {
            res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
        }
        else {
            res.status(500).json({ msg: "Erro desconhecido no servidor" });
        }
    }
});
exports.getSubject = getSubject;
