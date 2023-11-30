import { Document } from 'langchain/document';
import { readFile } from 'fs/promises';
import { BaseDocumentLoader } from 'langchain/document_loaders/base';


type FileStringMeta<T> =T & { source: string }
type FileBlobMeta<T> = FileStringMeta<T> & { source: 'blob'; blobType: string }


export abstract class BufferLoader<T> extends BaseDocumentLoader {
  constructor(public filePathOrBlob: string | Blob) {
    super();
  }

  protected abstract parse(
    raw: Buffer,
    metadata: object,
  ): Promise<Document<FileStringMeta<T> | FileBlobMeta<T>>[]>;

  public async load(): Promise<Document<FileStringMeta<T> | FileBlobMeta<T>>[]> {
    let buffer: Buffer;
    let metadata: Record<string, string>;
    if (typeof this.filePathOrBlob === 'string') {
      buffer = await readFile(this.filePathOrBlob);
      metadata = { source: this.filePathOrBlob };
    } else {
      buffer = await this.filePathOrBlob
        .arrayBuffer()
        .then((ab) => Buffer.from(ab));
      metadata = { source: 'blob', blobType: this.filePathOrBlob.type };
    }
    return this.parse(buffer, metadata);
  }
}



export class CustomPDFLoader extends BufferLoader<{ pdf_numpages: number }> {
  public async parse(
    raw: Buffer,
    metadata: { source: string },
  ) {
    const { pdf } = await PDFLoaderImports();
    const parsed = await pdf(raw);
    return [
      new Document({
        pageContent: parsed.text,
        metadata: {
          ...metadata,
          pdf_numpages: Number(parsed.numpages),
        },
      }),
    ];
  }
}

async function PDFLoaderImports() {
  try {
    // the main entrypoint has some debug code that we don't want to import
    const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js');
    return { pdf };
  } catch (e) {
    console.error(e);
    throw new Error(
      'Failed to load pdf-parse. Please install it with eg. `npm install pdf-parse`.',
    );
  }
}


export class DirectoryLoader extends BaseDocumentLoader {
  constructor(public directoryPath: string) {
    super();
  }

  public async load() {
    const { readdir } = await import('fs/promises');
    const { join } = await import('path');
    const files = await readdir(this.directoryPath);
    const pdfFiles = files.filter((file) => file.endsWith('.pdf'));
    const pdfPaths = pdfFiles.map((file) => join(this.directoryPath, file));
    const pdfLoaders = pdfPaths.map((path) => new CustomPDFLoader(path));
    const pdfs = await Promise.all(pdfLoaders.map((loader) => loader.load()));
    return pdfs.flat();
  }
}