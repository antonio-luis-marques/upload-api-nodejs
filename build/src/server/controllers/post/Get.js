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
        const { search, sort = "createdAt", order = "desc", page = 1, limit = 10 } = req.query;
        // Verificar campos de ordenação válidos
        const allowedSortFields = ["createdAt", "updatedAt", "title"];
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
        // Paginação
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
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
                    { title: { $regex: normalizedSearch, $options: "i" } }, // Buscar por título
                    { description: { $regex: normalizedSearch, $options: "i" } }, // Buscar por descrição
                ],
            }
            : {};
        // Buscar posts com paginação
        const posts = yield app_1.default.find(query)
            .skip(skip)
            .limit(take)
            .sort({ [sort]: sortOrder });
        // Contar o total de posts para a paginação
        const totalPosts = yield app_1.default.countDocuments(query);
        res.status(200).json({
            posts,
            total: totalPosts,
            page: parseInt(page),
            totalPages: Math.ceil(totalPosts / take),
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
