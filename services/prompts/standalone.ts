import { ChatPromptTemplate } from "langchain/prompts";

export const Standalone = {
  Prompt: ChatPromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

<chat_history>
  {chat_history}
</chat_history>

Follow Up Input: {question}
Standalone question:`)

};