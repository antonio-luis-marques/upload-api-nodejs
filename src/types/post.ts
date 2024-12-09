// Definição do tipo Post (certifique-se de incluir as propriedades fileQuestionUrl e fileAnswerUrl)
export interface Post {
    subject: string;
    questionTitle: string;
    questionDescription: string;
    answerTitle: string;
    answerDescription: string;
    fileQuestionUrl: string;  // Adicione a propriedade fileQuestionUrl
    fileAnswerUrl: string;    // Adicione a propriedade fileAnswerUrl
  }
  