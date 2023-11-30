import { Document } from "langchain/document";

export interface IVectorDb<
TStore,
TStoredMeta extends Record<string, any>,
TImportMeta extends Record<string, any> = TStoredMeta
> {
    documents: Document<TStoredMeta>[]
    GetStore(): Promise<TStore>

    ImportDocuments(docs: Document<TImportMeta>[]): Promise<void>

    MakeRetriever(): any
}
