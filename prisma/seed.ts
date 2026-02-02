import prisma from '@/lib/prisma';
async function main() {
  console.log('Sedang memulai seeding...')

  // Membuat data awal untuk Device
  // Upsert digunakan agar jika data sudah ada, tidak akan error (hanya update)
  const device = await prisma.device.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      deviceCode: 'FARM-001',
      pumpStatus: false,
      duration: 5,
    },
  })

  console.log({ device })
  console.log('Seeding selesai!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })