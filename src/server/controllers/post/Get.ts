import { Request, Response } from "express";
import PostModel from "../../models/post/app";

const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, sort = "createdAt", order = "desc" } = req.query;

    // Verificar campos de ordenação válidos
    const allowedSortFields = ["createdAt", "updatedAt", "subject"];
    if (!allowedSortFields.includes(sort as string)) {
      res.status(400).json({ error: "Campo de ordenação inválido." });
      return;
    }

    // Verificar ordem de ordenação válida
    const allowedOrders = ["asc", "desc"];
    if (!allowedOrders.includes(order as string)) {
      res.status(400).json({ error: "Ordem de ordenação inválida." });
      return;
    }

    // Normalizar e ajustar o campo de busca
    const decodedSearch = search ? decodeURIComponent(search as string) : "";
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
    const posts = await PostModel.find(query).sort({ [sort as string]: sortOrder });
    const totalPosts = posts.length;

    res.status(200).json({
      posts,
      total: totalPosts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erro interno do servidor.",
      details: error instanceof Error ? error.message : "Erro desconhecido.",
    });
  }
};

export { getPosts };
