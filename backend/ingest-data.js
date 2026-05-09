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
    text: "Hypertension (High Blood Pressure) symptoms include severe headaches, nosebleeds, fatigue, and vision problems. Long-term management involves reducing salt intake, regular exercise, and medication.",
    metadata: { category: "cardiology", source: "WHO" }
  },
  {
    id: "h2",
    text: "Common Cold symptoms include a runny nose, sore throat, and cough. Most people recover in 7-10 days. Rest and hydration are the primary treatments. If fever persists beyond 3 days, see a doctor.",
    metadata: { category: "general", source: "Mayo Clinic" }
  },
  {
    id: "h3",
    text: "Diabetes (Type 2) warning signs include increased thirst, frequent urination, unexplained weight loss, and blurred vision. Management focuses on blood sugar monitoring, diet, and exercise.",
    metadata: { category: "endocrinology", source: "IDF" }
  },
  {
    id: "h4",
    text: "Emergency Signs of Stroke (F.A.S.T): Facial drooping, Arm weakness, Speech difficulty, and Time to call emergency services. Every minute counts to prevent brain damage.",
    metadata: { category: "emergency", source: "American Heart Association" }
  },
  {
    id: "h5",
    text: "First Aid for Burns: Run cool (not cold) water over the area for 20 minutes. Do not use ice, butter, or ointments. Cover with a clean, non-stick bandage.",
    metadata: { category: "first-aid", source: "Red Cross" }
  },
  {
    id: "h6",
    text: "Dehydration Treatment: Drink small sips of water or ORS (Oral Rehydration Salts). Symptoms include dark urine, dizziness, and dry mouth. Severe cases require IV fluids at a clinic.",
    metadata: { category: "first-aid", source: "Rural Health Manual" }
  },
  {
    id: "h7",
    text: "Chest Pain (Heart Attack Signs): Pressure, squeezing, or pain in the center of the chest lasting more than a few minutes. May spread to shoulders, neck, or arms. Seek emergency care immediately.",
    metadata: { category: "emergency", source: "WHO" }
  },
  {
    id: "h8",
    text: "Pediatric Fever: A temperature above 100.4 F (38 C) is considered a fever. In infants under 3 months, any fever is an emergency and requires immediate medical evaluation.",
    metadata: { category: "pediatrics", source: "AAP" }
  },
  {
    id: "h9",
    text: "Asthma Flare-up: Symptoms include wheezing, chest tightness, and shortness of breath. Use a rescue inhaler immediately. If breathing doesn't improve, seek urgent medical help.",
    metadata: { category: "respiratory", source: "Global Initiative for Asthma" }
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
