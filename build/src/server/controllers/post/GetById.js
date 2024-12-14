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
exports.getPostById = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../../models/post/app"));
const getPostById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // Obtém o ID dos parâmetros da requisição
        // Valida o ID antes de buscar no banco
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ msg: "ID inválido!" });
            return;
        }
        // Busca o post no banco de dados pelo ID
        const post = yield app_1.default.findById(id);
        // Verifica se o post foi encontrado
        if (!post) {
            res.status(404).json({
                msg: "Post não encontrado!",
            });
            return;
        }
        // Retorna o post no formato JSON
        res.status(200).json({
            msg: "Post recuperado com sucesso!",
            data: post,
        });
    }
    catch (error) {
        console.error("Erro ao buscar o post:", error);
        if (error instanceof Error) {
            res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
        }
        else {
            res.status(500).json({ msg: "Erro desconhecido no servidor" });
        }
    }
});
exports.getPostById = getPostById;
