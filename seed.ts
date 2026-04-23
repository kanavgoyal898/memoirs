import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const firstName = process.env.SEED_ADMIN_FIRSTNAME
    const lastName = process.env.SEED_ADMIN_LASTNAME
    const quote = process.env.SEED_ADMIN_QUOTE
    const email = process.env.SEED_ADMIN_EMAIL
    const password = process.env.SEED_ADMIN_PASSWORD

    if (!email || !password || !firstName || !lastName || !quote) {
        throw new Error('Missing SEED_ADMIN_FIRSTNAME or SEED_ADMIN_LASTNAME or SEED_ADMIN_QUOTE or SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD in .env')
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const admin = await prisma.user.upsert({
        where: { collegeEmail: email },
        update: {
            passwordHash,
            role: 'ADMIN',
            mustChangePassword: true,
        },
        create: {
            collegeEmail: email,
            firstName: firstName,
            lastName: lastName,
            quote: quote,
            passwordHash,
            role: 'ADMIN',
            mustChangePassword: true,
        },
    })

    console.log('Admin created:', admin.collegeEmail)
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect())