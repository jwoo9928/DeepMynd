import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { VoyVectorStore } from "@langchain/community/vectorstores/voy";
import { Document } from "@langchain/core/documents";
import { Voy as VoyClient } from "voy-search";


class VoyVectorStorageController {
  private store: VoyVectorStore;
  private embeddings: HuggingFaceTransformersEmbeddings;
  private controller: VoyVectorStorageController

  constructor() {
    const client = new VoyClient();
    this.embeddings = new HuggingFaceTransformersEmbeddings({
      model: "BAAI/bge-small-en",
    });
    this.store = new VoyVectorStore(client, this.embeddings);
    this.controller = new VoyVectorStorageController();
  }

  public getinstance() {
    return this.controller;
  }

  public async addEntry(content: string, type: string) {
    try {
      await this.store.addDocuments([
        new Document({
          pageContent: content,
          metadata: { source: type },
        }),
        new Document({
          pageContent: content,
          metadata: { source: type },
        })]
      )
    } catch (e) {
      console.error(e);
    }
  }

  public async search(content: string, k: number) {
    const query = await this.embeddings.embedQuery(content);
    const results = await this.store.similaritySearchVectorWithScore(query, k);
    return results;
  }

}

export default VoyVectorStorageController;
