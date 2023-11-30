import { LanceStore } from '@/services/vectordb/landcedb';
import { Document } from "langchain/document";
import { environment } from '@/services/config';
import { DirectoryLoader } from '@/utils/customPDFLoader';



(async () => {
  console.log('👀 loading pdfs...')
  const loader = new DirectoryLoader(environment.APP_DOCUMENT_PATH)

  const files = (await loader.load())
  console.log('✔️ loaded %s pdfs', files.length)
  
  console.log('preparing documents...')
  const prepared = files.map(doc => ({
    pageContent: doc.pageContent,
    metadata: {
      title: doc.metadata.source,
      version: '1.0.0',
      ...doc.metadata,
    }
  }))
  console.log('prepared %s documents...', prepared.length)

  console.log('👀 importing documents...')
  await LanceStore.ImportDocuments(prepared);

  console.log('✔️ import complete');
})();
