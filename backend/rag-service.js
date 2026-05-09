/**
 * RAG Service — Full Architecture
 * 
 * Flow:
 * 1. NLP Entity Extraction (Groq) → Extract symptoms, duration, age from user query
 * 2. Vector Search (Pinecone) → Retrieve semantically relevant medical knowledge chunks
 * 3. LLM Response (Groq) → Generate evidence-based, context-aware answer
 * 
 * Fallback: If Pinecone is not configured, runs in Groq-only mode (still functional)
 */

const Groq = require('groq-sdk');
const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

class RAGService {
  constructor() {
    // ── Groq LLM ─────────────────────────────────────────────────────────────
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || groqKey === 'PASTE_YOUR_GROQ_KEY_HERE') {
      console.warn('[RAG] ⚠️  GROQ_API_KEY not set. AI chat will not function.');
    }
    this.groq = new Groq({ apiKey: groqKey || 'missing' });
    this.llmModel = 'llama-3.1-8b-instant'; // Direct replacement for decommissioned llama3-8b-8192

    // ── Pinecone Vector DB (optional) ────────────────────────────────────────
    this.pinecone = null;
    this.pineconeIndex = null;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const pineconeIndex = process.env.PINECONE_INDEX || 'health-knowledge';

    if (pineconeKey && pineconeKey !== 'your_key_here') {
      try {
        this.pinecone = new Pinecone({ apiKey: pineconeKey });
        // Use Pinecone's own inference API for embeddings (free, no extra key)
        this.pineconeIndex = pineconeKey; // store key, create index on first use
        this.pineconeIndexName = pineconeIndex;
        console.log('[RAG] ✅ Pinecone connected — Full RAG mode enabled.');
      } catch (e) {
        console.warn('[RAG] ⚠️  Pinecone init failed:', e.message);
        this.pinecone = null;
      }
    } else {
      console.log('[RAG] ℹ️  No Pinecone key — running in Groq-only mode (fully functional).');
    }
  }

  // ── Step 1: NLP Entity Extraction ─────────────────────────────────────────
  // Uses Groq LLM to parse the user's natural language query and extract
  // structured health entities: symptoms, duration, age, and intent.
  async extractEntities(userQuery) {
    try {
      const response = await this.groq.chat.completions.create({
        model: this.llmModel,
        messages: [
          {
            role: 'system',
            content: 'You are a medical NLP entity extractor. Extract health entities from patient queries. Return ONLY valid JSON, no explanation.'
          },
          {
            role: 'user',
            content: `Extract entities from: "${userQuery}"\n\nReturn JSON: { "symptoms": [], "duration": "", "age": "", "severity": "mild|moderate|severe", "intent": "" }`
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
      });

      const text = response.choices[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('[RAG] Entity extraction failed:', e.message);
    }
    // Fallback entity structure
    return { symptoms: [], duration: 'Not specified', age: 'Not specified', severity: 'mild', intent: 'General Health Inquiry' };
  }

  // ── Step 2: Vector Similarity Search (Pinecone RAG) ───────────────────────
  // Generates an embedding for the query and retrieves the top-K most
  // semantically similar medical knowledge chunks from Pinecone.
  async retrieveFromKnowledgeBase(queryText, entities) {
    if (!this.pinecone) return { facts: '', source: 'none' };

    try {
      // Build a rich search query from extracted entities
      const searchQuery = entities.symptoms.length > 0
        ? `${entities.symptoms.join(', ')} ${queryText}`
        : queryText;

      const index = this.pinecone.index(this.pineconeIndexName);

      // Use Pinecone's inference API to embed the query (free, no extra key)
      const embeddingResponse = await this.pinecone.inference.embed(
        'multilingual-e5-large',
        [searchQuery],
        { inputType: 'query', truncate: 'END' }
      );

      const queryVector = embeddingResponse.data[0].values;

      const results = await index.query({
        vector: queryVector,
        topK: 3,
        includeMetadata: true,
      });

      const facts = results.matches
        .filter(m => m.score > 0.5) // Only use high-confidence matches
        .map(m => `[${m.metadata?.category || 'Health'}] ${m.metadata?.text}`)
        .join('\n---\n');

      return { facts, source: 'pinecone' };
    } catch (error) {
      console.warn('[RAG] Pinecone search failed:', error.message);
      return { facts: '', source: 'fallback' };
    }
  }

  // ── Step 3: LLM Response Generation (Groq) ───────────────────────────────
  // Takes entities + retrieved medical facts and generates a comprehensive,
  // evidence-based, empathetic health response.
  async generateResponse(userQuery, entities, medicalFacts, chatHistory = []) {
    const contextSection = medicalFacts
      ? `\nVERIFIED MEDICAL KNOWLEDGE (from knowledge base):\n${medicalFacts}\n`
      : '';

    const systemPrompt = `You are MediCare AI, an advanced, empathetic virtual Health Companion built to support patients — especially in rural communities with limited healthcare access.

PATIENT CONTEXT (extracted by NLP):
- Identified Symptoms: ${entities.symptoms.join(', ') || 'Not specified'}
- Duration: ${entities.duration}
- Patient Age: ${entities.age}
- Severity Assessment: ${entities.severity}
- Query Intent: ${entities.intent}
${contextSection}
RESPONSE GUIDELINES:
1. Be warm, empathetic, and professional. Acknowledge the patient's concern first.
2. 🚨 EMERGENCY CHECK: If symptoms suggest emergency (chest pain, stroke signs, difficulty breathing, severe bleeding), immediately advise calling emergency services.
3. Explain 2-3 possible causes based on the symptoms — but NEVER give a definitive diagnosis.
4. Provide actionable self-care steps (hydration, rest, OTC medications if appropriate).
5. Advise when to see a doctor (e.g., "if fever exceeds 3 days...").
6. Keep response concise: 3-4 short paragraphs maximum.
7. End EVERY response with: "⚠️ This is AI-generated health guidance and not a substitute for professional medical advice. Please consult a qualified doctor for an accurate diagnosis."`;

    // Convert chat history to Groq format (last 6 exchanges for context)
    const historyMessages = (chatHistory || []).slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.parts?.[0]?.text || m.text || ''
    })).filter(m => m.content.trim());

    const response = await this.groq.chat.completions.create({
      model: this.llmModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userQuery }
      ],
      max_tokens: 700,
      temperature: 0.6,
    });

    return response.choices[0]?.message?.content || 'I was unable to generate a response. Please try again.';
  }

  // ── Main Pipeline Entry Point ─────────────────────────────────────────────
  async getRAGResponse(userQuery, chatHistory = []) {
    // Step 1: NLP — Extract structured entities
    console.log('[RAG] Step 1: Extracting health entities...');
    const entities = await this.extractEntities(userQuery);
    console.log('[RAG] Entities:', JSON.stringify(entities));

    // Step 2: RAG — Retrieve relevant medical knowledge from Pinecone
    console.log('[RAG] Step 2: Querying knowledge base...');
    const { facts, source } = await this.retrieveFromKnowledgeBase(userQuery, entities);
    console.log(`[RAG] Retrieved from: ${source} — ${facts ? facts.length + ' chars' : 'no results'}`);

    // Step 3: LLM — Generate the final context-aware response
    console.log('[RAG] Step 3: Generating AI response...');
    const answer = await this.generateResponse(userQuery, entities, facts, chatHistory);

    return answer;
  }
}

module.exports = new RAGService();
