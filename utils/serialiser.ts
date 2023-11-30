import type { Document } from 'langchain/document';

export function serialiser(docs: Document[], separator = '\n\n') {
  const output = [];
  for (let index = 0; index < docs.length; index++) {
    const doc = docs[index];
    output.push(doc.pageContent);
  }
  return output.join(separator);
}
