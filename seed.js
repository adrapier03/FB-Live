const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            role: 'ADMIN' // Reset role to ADMIN if exists
        },
        create: {
            username: 'admin',
            password: 'admin', // In production, hash this!
            role: 'ADMIN',
        },
    });
    console.log({ user });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
