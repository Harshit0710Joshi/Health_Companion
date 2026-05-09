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

  // The main Chat function with Smart RAG logic
  async getRAGResponse(userQuery, chatHistory = []) {
    // 1. First, use LLM to extract entities (Symptoms, Age, Duration)
    const extractionPrompt = `
      Extract key health entities from this query: "${userQuery}"
      Return ONLY a JSON object with: { "symptoms": [], "duration": "", "age": "", "intent": "" }
    `;
    
    let entities = { symptoms: [], duration: "Not specified", age: "Not specified", intent: "General Inquiry" };
    try {
      const extractionResult = await this.model.generateContent(extractionPrompt);
      const text = extractionResult.response.text();
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) entities = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn("Entity extraction failed, proceeding with raw query.");
    }

    // 2. Retrieve facts from Pinecone using the extracted symptoms + raw query
    const searchQuery = entities.symptoms.length > 0 
      ? `${entities.symptoms.join(', ')} - ${userQuery}`
      : userQuery;
    
    const medicalFacts = await this.queryKnowledgeBase(searchQuery);

    // 3. Build a high-end evidence-based prompt
    const systemPrompt = `
      You are an advanced virtual Health Companion. 
      
      PATIENT CONTEXT:
      - Symptoms identified: ${entities.symptoms.join(', ') || 'None identified'}
      - Duration: ${entities.duration}
      - Patient Age: ${entities.age}
      - Detected Intent: ${entities.intent}

      VERIFIED MEDICAL DATA (from Knowledge Base):
      ${medicalFacts || "No specific context found. Use professional medical logic."}
      
      INSTRUCTIONS:
      1. Provide a context-aware, empathetic response based on the patient's age and duration of symptoms.
      2. If symptoms suggest an emergency (e.g., chest pain, difficulty breathing), immediately advise seeking emergency care.
      3. Use the verified data to explain possible causes but NEVER provide a definitive diagnosis.
      4. Always end with a professional health disclaimer.

      USER QUERY: ${userQuery}
    `;

    // 4. Generate the final response
    const chat = this.model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(systemPrompt);
    return result.response.text();
  }
}

module.exports = new RAGService();
