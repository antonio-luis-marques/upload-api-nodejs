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
exports.getPosts = void 0;
const app_1 = __importDefault(require("../../models/post/app"));
const getPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, sort = "createdAt", order = "desc" } = req.query;
        // Verificar campos de ordenação válidos
        const allowedSortFields = ["createdAt", "updatedAt", "subject"];
        if (!allowedSortFields.includes(sort)) {
            res.status(400).json({ error: "Campo de ordenação inválido." });
            return;
        }
        // Verificar ordem de ordenação válida
        const allowedOrders = ["asc", "desc"];
        if (!allowedOrders.includes(order)) {
            res.status(400).json({ error: "Ordem de ordenação inválida." });
            return;
        }
        // Normalizar e ajustar o campo de busca
        const decodedSearch = search ? decodeURIComponent(search) : "";
        const searchWithSpaces = decodedSearch.replace(/\+/g, " ");
        const normalizedSearch = searchWithSpaces
            ? searchWithSpaces.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            : "";
        const sortOrder = order === "desc" ? -1 : 1;
        // Construir query para o filtro de busca
        const query = normalizedSearch
            ? {
                $or: [
                    { subject: { $regex: normalizedSearch, $options: "i" } },
                    { questionTitle: { $regex: normalizedSearch, $options: "i" } },
                    { questionDescription: { $regex: normalizedSearch, $options: "i" } },
                    { "answers.answerDescription": { $regex: normalizedSearch, $options: "i" } },
                    { "answers.answerTitle": { $regex: normalizedSearch, $options: "i" } },
                ],
            }
            : {};
        // Buscar todos os posts (sem paginação ou limite)
        const posts = yield app_1.default.find(query).sort({ [sort]: sortOrder });
        const totalPosts = posts.length;
        res.status(200).json({
            posts,
            total: totalPosts,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Erro interno do servidor.",
            details: error instanceof Error ? error.message : "Erro desconhecido.",
        });
    }
});
exports.getPosts = getPosts;
