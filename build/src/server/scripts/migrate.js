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
exports.migrate = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../models/post/app"));
const migrate = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Iniciando a migração...");
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Buscar documentos com o formato antigo (array de strings)
        const postsToMigrate = yield app_1.default.find({
            "fileQuestionUrls.0": { $type: "string" },
        });
        console.log(`Documentos encontrados para migração: ${postsToMigrate.length}`);
        for (const post of postsToMigrate) {
            try {
                if (Array.isArray(post.fileQuestionUrls)) {
                    // Tratar como um array de strings e mapear para o novo formato
                    const updatedFileQuestionUrls = post.fileQuestionUrls.map((url) => {
                        if (typeof url === "string" && url.trim() !== "") {
                            // Caso seja uma string válida, retorna o novo formato
                            return { original: url, cover: null };
                        }
                        else if (url && typeof url.original === "string") {
                            // Caso já esteja no formato esperado, retorna o mesmo objeto
                            return url;
                        }
                        else {
                            // Para qualquer outro caso, retorna um valor padrão
                            return { original: "URL inválida", cover: null };
                        }
                    });
                    post.fileQuestionUrls = updatedFileQuestionUrls;
                }
                // Salvar o documento atualizado na transação
                yield post.save({ session });
                console.log(`Documento ${post._id} migrado com sucesso.`);
            }
            catch (err) {
                console.error(`Erro ao migrar documento ${post._id}:`, err);
            }
        }
        // Commit da transação
        yield session.commitTransaction();
        console.log("Migração concluída!");
    }
    catch (error) {
        // Abortar transação em caso de erro
        yield session.abortTransaction();
        console.error("Erro durante a migração:", error);
    }
    finally {
        session.endSession();
    }
});
exports.migrate = migrate;
