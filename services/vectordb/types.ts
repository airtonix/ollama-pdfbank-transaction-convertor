import { Document } from "langchain/document";

export interface IVectorDb<TStore> {
    documents: Document<Record<string, any>>[]

    GetStore(): Promise<TStore>

    ImportDocuments(docs: Document<Record<string, any>>[]): Promise<void>

    MakeRetriever(): any
}