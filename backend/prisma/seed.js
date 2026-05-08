const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await require('bcryptjs').hash('password123', 10);
  const doctors = [
    {
      name: "Dr. Sarah Johnson",
      email: "sarah@medicare.local",
      password: hashedPassword,
      specialization: "Cardiologist",
      rating: 4.9,
      experience: "12 years",
      fee: "$100",
      initials: "SJ",
      color: "from-blue-500 to-cyan-400"
    },
    {
      name: "Dr. Michael Chen",
      email: "michael@medicare.local",
      password: hashedPassword,
      specialization: "Neurologist",
      rating: 4.8,
      experience: "15 years",
      fee: "$120",
      initials: "MC",
      color: "from-purple-500 to-indigo-400"
    },
    {
      name: "Dr. Elena Rodriguez",
      email: "elena@medicare.local",
      password: hashedPassword,
      specialization: "Pediatrician",
      rating: 4.7,
      experience: "8 years",
      fee: "$80",
      initials: "ER",
      color: "from-rose-500 to-pink-400"
    },
    {
      name: "Dr. Rajesh Khanna",
      email: "rajesh@medicare.local",
      password: hashedPassword,
      specialization: "Dermatologist",
      rating: 4.9,
      experience: "10 years",
      fee: "$90",
      initials: "RK",
      color: "from-orange-500 to-yellow-400"
    }
  ];

  for (const doctor of doctors) {
    await prisma.doctor.upsert({
      where: { email: doctor.email },
      update: doctor,
      create: doctor,
    });
  }

  console.log('Seed completed: Added 3 doctors.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
