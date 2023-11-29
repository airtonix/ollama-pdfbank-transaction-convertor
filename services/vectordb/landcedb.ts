import { Table, WriteMode, connect } from 'vectordb';
import { LanceDB } from 'langchain/vectorstores/lancedb';
import { OllamaEmbeddings } from 'langchain/embeddings/ollama';
import { environment } from '../config';
import { IVectorDb } from './types';
import type { Document } from 'langchain/document';

export const LanceStore = await InitLanceStore();

async function InitLanceStore() {
  try {
    console.log('initializing LanceDB...')
    
    const db = await connect(environment.APP_VECTORDB_FILE);
    let table: Table<number[]>;
    

    const store: IVectorDb<LanceDB> = {
      documents: [
        {
          pageContent: '',
          metadata: {},
        },
      ],

      async GetStore() {
        console.log('opening table %s...', environment.APP_VECTORDB_TABLE);
        table = await db.openTable(environment.APP_VECTORDB_TABLE);

        const store = LanceDB.fromDocuments(
          this.documents,
          new OllamaEmbeddings(),
          { table },
        );
        return store;
      },

      async ImportDocuments(documents) {
        //embed the PDF documents
        console.log('creating table %s...', environment.APP_VECTORDB_TABLE);
        table = await db.createTable(
          environment.APP_VECTORDB_TABLE,
          [
            {
              vector: Array(1536), 
              pageContent: 'string', 
              source: 'string',
            },
          ],
          { writeMode: WriteMode.Overwrite }
        );
        const embeddings = new OllamaEmbeddings();

        await LanceDB.fromDocuments(documents, embeddings, {
          table,
          textKey: 'text',
        });
        console.log('ingested %s documents', documents.length);

      },

      async MakeRetriever() {
        const vectorStore = await this.GetStore();
        // Use a callback to get intermediate sources from the middle of the chain
        let resolveWithDocuments: (value: Document[]) => void;
        const documentPromise = new Promise<Document[]>((resolve) => {
          resolveWithDocuments = resolve;
        });
        const retriever = vectorStore.asRetriever({
          callbacks: [
            {
              handleRetrieverEnd(documents) {
                resolveWithDocuments(documents);
              },
            },
          ],
        });
        return {retriever, documentPromise};
      },
    };

    return store;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize LanceDB');
  }
}
