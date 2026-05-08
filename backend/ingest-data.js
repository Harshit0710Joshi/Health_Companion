const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX || 'health-knowledge');

// EXAMPLE DATA: Replace this with your actual medical documents or rural health info
const medicalKnowledge = [
  {
    id: "h1",
    text: "Hypertension (High Blood Pressure) symptoms include severe headaches, nosebleeds, fatigue, and vision problems. It is often called a silent killer because it may have no symptoms.",
    metadata: { category: "cardiology", source: "WHO" }
  },
  {
    id: "h2",
    text: "In rural areas, dehydration is common during summer. Recommended treatment is ORS (Oral Rehydration Salts) or a mix of clean water, sugar, and a pinch of salt.",
    metadata: { category: "first-aid", source: "Rural Health Manual" }
  }
];

async function ingest() {
  console.log("🚀 Starting Medical Data Ingestion...");

  for (const item of medicalKnowledge) {
    console.log(`Processing: ${item.id}`);
    
    // 1. Create the vector (math)
    const result = await embeddingModel.embedContent(item.text);
    const vector = result.embedding.values;

    // 2. Upload to Pinecone
    await index.upsert([{
      id: item.id,
      values: vector,
      metadata: { text: item.text, ...item.metadata }
    }]);
  }

  console.log("✅ Ingestion Complete! Your chatbot is now smarter.");
}

ingest().catch(console.error);
