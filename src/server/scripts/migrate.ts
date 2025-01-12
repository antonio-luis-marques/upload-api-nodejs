import mongoose from "mongoose";
import PostModel from "../models/post/app";

export const migrate = async () => {
  console.log("Iniciando a migração...");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Buscar documentos com o formato antigo (array de strings)
    const postsToMigrate = await PostModel.find({
      "fileQuestionUrls.0": { $type: "string" },
    });

    console.log(`Documentos encontrados para migração: ${postsToMigrate.length}`);

    for (const post of postsToMigrate) {
      try {
        if (Array.isArray(post.fileQuestionUrls)) {
          // Tratar como um array de strings e mapear para o novo formato
          const updatedFileQuestionUrls = post.fileQuestionUrls.map((url: any) => {
            if (typeof url === "string" && url.trim() !== "") {
              // Caso seja uma string válida, retorna o novo formato
              return { original: url, cover: null };
            } else if (url && typeof url.original === "string") {
              // Caso já esteja no formato esperado, retorna o mesmo objeto
              return url;
            } else {
              // Para qualquer outro caso, retorna um valor padrão
              return { original: "URL inválida", cover: null };
            }
          });          
          post.fileQuestionUrls = updatedFileQuestionUrls;
        }

        // Salvar o documento atualizado na transação
        await post.save({ session });
        console.log(`Documento ${post._id} migrado com sucesso.`);
      } catch (err) {
        console.error(`Erro ao migrar documento ${post._id}:`, err);
      }
    }

    // Commit da transação
    await session.commitTransaction();
    console.log("Migração concluída!");
  } catch (error) {
    // Abortar transação em caso de erro
    await session.abortTransaction();
    console.error("Erro durante a migração:", error);
  } finally {
    session.endSession();
  }
};