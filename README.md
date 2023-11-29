# Ollama & LangChain - Create a ChatGPT Chatbot for Your PDF Files

Use Ollama api to build a chatGPT chatbot for multiple Large PDF files.

Tech stack used includes LangChain, LanceDB, Typescript, Ollama, and Next.js.

LangChain is a framework that makes it easier to build scalable AI/LLM apps and chatbots.
LanceDB is a vectorstore for storing embeddings and your PDF in text to later retrieve similar docs.


## Development

1. Clone
2. `devbox shell`
3. `yarn`
4. add docs to `docs`,
5. `yarn import`
6. `yarn dev`


## Convert your PDF files to embeddings

**This repo can load multiple PDF files**

1. Inside `docs` folder, add your pdf files or folders that contain pdf files.

2. Run the script `yarn import` to 'ingest' and embed your docs. If you run into errors troubleshoot below.


## Run the app

> 🛑 ☝️ import your pdfs first.

You can run the app `yarn dev` to launch the local dev environment, and then type a question in the chat interface.
