import { ChatOllama } from 'langchain/chat_models/ollama';
import { RunnableSequence } from 'langchain/schema/runnable';
import { StringOutputParser } from 'langchain/schema/output_parser';
import type { VectorStoreRetriever } from 'langchain/vectorstores/base';
import { Standalone } from '@/services/prompts/standalone';
import { CsvConvertor } from '@/services/prompts/csv-parser';
import { serialiser } from '@/utils/serialiser';

export const NewConversationChain = (retriever: VectorStoreRetriever) => {


const model = new ChatOllama({
    temperature: 0, // increase temperature to get more creative answers
    model: 'llama2'
  });

  // Rephrase the initial question into a dereferenced standalone question based on
  // the chat history to allow effective vectorstore querying.
  const standaloneQuestionChain = RunnableSequence.from([
    Standalone.Prompt,
    model,
    new StringOutputParser(),
  ]);

  // Retrieve documents based on a query, then format them.
  const retrievalChain = retriever.pipe(serialiser);

  // Generate an answer to the standalone question based on the chat history
  // and retrieved documents. Additionally, we return the source documents directly.
  const answerChain = RunnableSequence.from([
    {
      question: (input) => input.question,
      context: RunnableSequence.from([
        (input) => input.question,
        retrievalChain,
      ]),
      chat_history: (input) => input.chat_history,
    },
    CsvConvertor.Prompt,
    model,
    new StringOutputParser(),
  ]);

  // First generate a standalone question, then answer it based on
  // chat history and retrieved context documents.
  const conversationalRetrievalQAChain = RunnableSequence.from([
    {
      question: standaloneQuestionChain,
      chat_history: (input) => input.chat_history,
    },
    answerChain,
  ]);

  return conversationalRetrievalQAChain;
};
