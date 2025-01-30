import { Request, Response } from "express";
import PostModel from "../../models/post/app";

const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, sort = "createdAt", order = "desc", page = 1, limit = 10 } = req.query;

    // Verificar campos de ordenação válidos
    const allowedSortFields = ["createdAt", "updatedAt", "title"];
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

    // Paginação
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Ajustar a query para normalizar os campos `title` e `description`
    const searchString = typeof search === "string" ? search : ""; // Garantir que seja uma string

    const normalizedSearch = searchString
      ? searchString.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      : "";

      const query = normalizedSearch
      ? {
          $or: [
            {
              title: {
                $regex: new RegExp(normalizedSearch.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), "i"), // Normaliza o título e ignora acentos
              },
            },
            {
              description: {
                $regex: new RegExp(normalizedSearch.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), "i"), // Normaliza a descrição e ignora acentos
              },
            },
          ],
        }
      : {};    

    const sortOrder = order === "desc" ? -1 : 1;

    // Buscar posts com paginação
    const posts = await PostModel.find(query)
      .skip(skip)
      .limit(take)
      .sort({ [sort as string]: sortOrder });

    // Contar o total de posts para a paginação
    const totalPosts = await PostModel.countDocuments(query);

    res.status(200).json({
      posts,
      total: totalPosts,
      page: parseInt(page as string),
      totalPages: Math.ceil(totalPosts / take),
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
