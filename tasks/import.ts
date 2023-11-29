import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { LanceStore } from '@/services/vectordb/landcedb';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { environment } from '@/services/config';

(async () => {


  /*load raw docs from the all files in the directory */
  const directoryLoader = new DirectoryLoader(environment.APP_DOCUMENT_PATH, {
    '.pdf': (path) => new PDFLoader(path),
  });

  // const loader = new PDFLoader(filePath);
  const raw = await directoryLoader.load();

  /* Split text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const documents = await textSplitter.splitDocuments(raw);
  const santised = documents.map(doc => ({
    pageContent: doc.pageContent,
    source: doc.metadata.source,
    metadata: {}
  }))

  console.log('creating vector store...');
  await LanceStore.ImportDocuments(santised);

  console.log('import complete');
})();
