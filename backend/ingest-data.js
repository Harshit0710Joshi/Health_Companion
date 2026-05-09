/**
 * Medical Knowledge Ingestion Script
 * 
 * Embeds medical knowledge chunks using Pinecone's free Inference API
 * and stores them in the Pinecone vector index for RAG retrieval.
 * 
 * Run once: node ingest-data.js
 */

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const INDEX_NAME = process.env.PINECONE_INDEX || 'health-knowledge';
const EMBEDDING_MODEL = 'multilingual-e5-large'; // Free Pinecone inference model (no Groq needed for embeddings)
const EMBEDDING_DIMENSION = 1024;

// ── Medical Knowledge Base ───────────────────────────────────────────────────
const medicalKnowledge = [
  {
    id: 'h1',
    text: 'Hypertension (High Blood Pressure) symptoms include severe headaches, nosebleeds, fatigue, and vision problems. Long-term management involves reducing salt intake, regular exercise, and medication as prescribed.',
    metadata: { category: 'cardiology', source: 'WHO' }
  },
  {
    id: 'h2',
    text: 'Common Cold symptoms include runny nose, sore throat, cough, and mild fever. Most people recover in 7-10 days. Rest and hydration are the primary treatments. If fever persists beyond 3 days or worsens, see a doctor.',
    metadata: { category: 'general', source: 'Mayo Clinic' }
  },
  {
    id: 'h3',
    text: 'Diabetes (Type 2) warning signs include increased thirst, frequent urination, unexplained weight loss, fatigue, and blurred vision. Management focuses on blood sugar monitoring, diet control, and regular exercise.',
    metadata: { category: 'endocrinology', source: 'IDF' }
  },
  {
    id: 'h4',
    text: 'Emergency Signs of Stroke (F.A.S.T): Facial drooping on one side, Arm weakness or numbness, Speech difficulty or slurring, Time to call emergency services immediately. Every minute of delay causes permanent brain damage.',
    metadata: { category: 'emergency', source: 'American Heart Association' }
  },
  {
    id: 'h5',
    text: 'First Aid for Burns: Run cool (not cold) water over the burned area for 20 minutes. Do not apply ice, butter, or toothpaste. Cover with a clean, non-stick bandage. Seek medical attention for burns larger than the patient\'s palm.',
    metadata: { category: 'first-aid', source: 'Red Cross' }
  },
  {
    id: 'h6',
    text: 'Dehydration Treatment: Drink small, frequent sips of water or ORS (Oral Rehydration Salts). Key symptoms are dark urine, dizziness, dry mouth, and decreased urination. Severe dehydration requires IV fluids at a clinic.',
    metadata: { category: 'first-aid', source: 'Rural Health Manual' }
  },
  {
    id: 'h7',
    text: 'Heart Attack Warning Signs: Pressure, squeezing, or pain in the center of the chest lasting more than a few minutes. Pain may radiate to shoulders, neck, jaw, or arms. Shortness of breath, nausea, cold sweat. Call emergency services immediately.',
    metadata: { category: 'emergency', source: 'WHO' }
  },
  {
    id: 'h8',
    text: 'Pediatric Fever: A temperature above 100.4°F (38°C) is a fever. In infants under 3 months, any fever is a medical emergency requiring immediate evaluation. For older children, use acetaminophen or ibuprofen and monitor closely.',
    metadata: { category: 'pediatrics', source: 'AAP' }
  },
  {
    id: 'h9',
    text: 'Asthma Flare-up: Symptoms include wheezing, chest tightness, shortness of breath, and coughing especially at night. Use a rescue inhaler (salbutamol) immediately. If breathing does not improve in 15 minutes, seek urgent medical help.',
    metadata: { category: 'respiratory', source: 'GINA' }
  },
  {
    id: 'h10',
    text: 'Malaria Prevention and Symptoms: Malaria causes cyclic fever, chills, sweating, headaches, and muscle pain. Prevention involves mosquito nets, insect repellent, and antimalarial drugs when in endemic areas. Seek testing immediately if symptoms appear.',
    metadata: { category: 'infectious-disease', source: 'WHO Rural Health' }
  },
  {
    id: 'h11',
    text: 'Dengue Fever Warning Signs: Sudden high fever (104°F), severe headache, pain behind eyes, joint/muscle pain, and skin rash. Warning signs of severe dengue include bleeding gums, blood in urine, and abdominal pain. Hospitalization may be required.',
    metadata: { category: 'infectious-disease', source: 'WHO' }
  },
  {
    id: 'h12',
    text: 'Pregnancy Danger Signs requiring immediate medical attention: heavy vaginal bleeding, severe abdominal pain, high fever, severe headache with vision changes, reduced fetal movement, swelling of hands and face.',
    metadata: { category: 'obstetrics', source: 'ACOG' }
  },
  {
    id: 'h13',
    text: 'Anemia Symptoms: Fatigue, weakness, pale skin, shortness of breath, dizziness, cold hands/feet. Common in women and children in rural areas. Iron-rich foods (leafy greens, meat, legumes) and iron supplements are the primary treatment.',
    metadata: { category: 'hematology', source: 'Rural Health Manual' }
  },
  {
    id: 'h14',
    text: 'Mental Health: Signs of depression include persistent sadness, loss of interest in activities, changes in sleep and appetite, difficulty concentrating, and thoughts of self-harm. Professional counseling and community support are effective treatments.',
    metadata: { category: 'mental-health', source: 'WHO' }
  },
  {
    id: 'h15',
    text: 'Food Poisoning Treatment: Symptoms include nausea, vomiting, diarrhea, and stomach cramps within hours of eating contaminated food. Treatment is rest, hydration, and ORS. Seek medical help if symptoms last more than 2 days or blood appears in stool.',
    metadata: { category: 'gastroenterology', source: 'CDC' }
  }
];

async function ensureIndex() {
  const indexes = await pc.listIndexes();
  const exists = indexes.indexes?.some(i => i.name === INDEX_NAME);

  if (!exists) {
    console.log(`📦 Creating Pinecone index: ${INDEX_NAME}...`);
    await pc.createIndex({
      name: INDEX_NAME,
      dimension: EMBEDDING_DIMENSION,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    // Wait for index to be ready
    console.log('⏳ Waiting for index to initialize...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('✅ Index ready.');
  } else {
    console.log(`✅ Index "${INDEX_NAME}" already exists.`);
  }
}

async function ingest() {
  console.log('🚀 Starting Medical Knowledge Ingestion...');
  console.log(`   Model: ${EMBEDDING_MODEL} (free Pinecone inference)`);
  console.log(`   Index: ${INDEX_NAME}`);
  console.log(`   Items: ${medicalKnowledge.length} medical knowledge chunks\n`);

  await ensureIndex();
  const index = pc.index(INDEX_NAME);

  // Process in batches of 5
  const batchSize = 5;
  for (let i = 0; i < medicalKnowledge.length; i += batchSize) {
    const batch = medicalKnowledge.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(medicalKnowledge.length / batchSize)}...`);

    // Embed all texts in the batch at once using Pinecone inference
    const texts = batch.map(item => item.text);
    const embeddings = await pc.inference.embed(
      EMBEDDING_MODEL,
      texts,
      { inputType: 'passage', truncate: 'END' }
    );

    // Upsert to Pinecone
    const vectors = batch.map((item, idx) => ({
      id: item.id,
      values: embeddings.data[idx].values,
      metadata: { text: item.text, ...item.metadata }
    }));

    await index.upsert(vectors);
    console.log(`   ✅ Uploaded: ${batch.map(b => b.id).join(', ')}`);
  }

  console.log('\n✅ Ingestion Complete! Your chatbot knowledge base is ready.');
  console.log('   The RAG system will now retrieve relevant medical context for every query.');
}

ingest().catch(err => {
  console.error('❌ Ingestion failed:', err.message);
  process.exit(1);
});
