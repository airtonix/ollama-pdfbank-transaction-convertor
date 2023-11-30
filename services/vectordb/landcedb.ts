import { Table, WriteMode, connect } from 'vectordb';
import { LanceDB } from 'langchain/vectorstores/lancedb';
import { OllamaEmbeddings } from 'langchain/embeddings/ollama';
import { environment } from '../config';
import { IVectorDb } from './types';
import type { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const LanceStore = await InitLanceStore();



export type PdfImportMetadata = {
  title: string;
  version: string;
  source: string;
  pdf_numpages: number;
};
export type PdfStoredMeta = PdfImportMetadata & {
  loc: {
    lines: {
      from: number;
      to: number;
    };
  };
};

async function InitLanceStore() {
  try {
    console.log('initializing LanceDB...');

    const db = await connect(environment.APP_VECTORDB_FILE);
    let table: Table<number[]>;

    async function splitDocumentIntoChunks(
      documents: Document<PdfImportMetadata>[],
    ) {
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const chunks = await textSplitter.splitDocuments(documents) as Document<PdfStoredMeta>[];

      return chunks
    }

    const store: IVectorDb<LanceDB, PdfStoredMeta, PdfImportMetadata> = {
      documents: [],

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
        const embeddings = new OllamaEmbeddings();

        console.log('👀 splitting documents...');
        /* Split text into chunks */
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        const chunks = await splitDocumentIntoChunks(documents);
        console.log(
          '✔️  split %s documents into %s vectors',
          documents.length,
          chunks.length,
        );

        const exsitingTables = await db.tableNames();
        if (exsitingTables.includes(environment.APP_VECTORDB_TABLE)) {
          console.log(
            '👀 deleting table %s...',
            environment.APP_VECTORDB_TABLE,
          );
          await db.dropTable(environment.APP_VECTORDB_TABLE);
        }

        console.log('👀 creating table %s...', environment.APP_VECTORDB_TABLE);
        table = await db.createTable(
          environment.APP_VECTORDB_TABLE,
          [
            {
              vector: Array(4096),
              pageContent: '',
              title: '',
              version: '',
              source: '',
              pdf_numpages: 1,
              loc: {
                lines: {
                  from: 1,
                  to: 1,
                },
              },
            },
          ],
          { writeMode: WriteMode.Overwrite },
        );

        console.log('👀 ingesting %s chunks...', chunks.length);

        LanceDB.fromDocuments(chunks, embeddings, {
          table,
          textKey: 'pageContent',
        });

        console.log('✔️  ingested %s documents', documents.length);
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
        return { retriever, documentPromise };
      },
    };

    return store;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize LanceDB');
  }
}
