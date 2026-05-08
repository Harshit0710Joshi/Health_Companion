const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// This service is isolated to keep the main server.js clean
class RAGService {
  constructor() {
    this.pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || 'your_pinecone_key_here'
    });
    
    this.genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
  }

  // Convert text into a vector (math) that Pinecone understands
  async getEmbedding(text) {
    const result = await this.embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  // Search Pinecone for relevant health information
  async queryKnowledgeBase(queryText) {
    try {
      const index = this.pc.index(process.env.PINECONE_INDEX || 'health-knowledge');
      const queryEmbedding = await this.getEmbedding(queryText);
      
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 3,
        includeMetadata: true
      });

      return queryResponse.matches.map(m => m.metadata.text).join('\n---\n');
    } catch (error) {
      console.warn("Pinecone search failed or not configured, falling back to general knowledge.");
      return "";
    }
  }

  // The main Chat function with RAG logic
  async getRAGResponse(userQuery, chatHistory = []) {
    // 1. Retrieve facts from Pinecone
    const medicalFacts = await this.queryKnowledgeBase(userQuery);

    // 2. Build a smart prompt with the facts
    const systemPrompt = `
      You are a high-end Virtual Health Assistant. 
      Use the following verified medical context to answer the user's question.
      If the context doesn't contain the answer, use your general medical knowledge but be extra cautious.
      
      VERIFIED CONTEXT:
      ${medicalFacts || "No specific context found. Use general guidance."}
      
      USER QUESTION: ${userQuery}
      
      REMEMBER: Always include a professional medical disclaimer. Be empathetic and concise.
    `;

    // 3. Generate the response using Gemini
    const chat = this.model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(systemPrompt);
    return result.response.text();
  }
}

module.exports = new RAGService();
