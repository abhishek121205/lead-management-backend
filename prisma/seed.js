import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // Check or create demo admin
    const adminEmail = "admin@crm.com";
    let admin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!admin) {
        const hashedPassword = await bcrypt.hash("Password123!", 10);
        admin = await prisma.user.create({
            data: {
                userName: "Admin User",
                email: adminEmail,
                password: hashedPassword,
                role: "ADMIN"
            }
        });
        console.log(`Created demo admin user: ${adminEmail} (password: Password123!)`);
    } else {
        console.log(`Demo admin already exists: ${adminEmail}`);
    }

    // Check if leads already exist
    const count = await prisma.lead.count();
    if (count === 0) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const sampleLeads = [
            {
                name: "Alex Morgan",
                email: "alex.morgan@techcorp.io",
                phone: "+1 555-0199",
                source: "Website",
                notes: "Interested in the enterprise plan for 25 team members. Needs a demo next week.",
                stage: "NEW",
                followUpDate: tomorrow,
                userId: admin.id
            },
            {
                name: "Sophia Chen",
                email: "sophia.chen@innovate.co",
                phone: "+1 555-0248",
                source: "LinkedIn",
                notes: "Initial phone call completed. Discussed budget and integration timeline.",
                stage: "CONTACTED",
                followUpDate: today,
                userId: admin.id
            },
            {
                name: "David Miller",
                email: "david.m@growthlabs.com",
                phone: "+1 555-0371",
                source: "Referral",
                notes: "Requirements validated. Client requested customized pricing proposal.",
                stage: "QUALIFIED",
                followUpDate: nextWeek,
                userId: admin.id
            },
            {
                name: "Emma Watson",
                email: "emma.w@apexsolutions.org",
                phone: "+1 555-0482",
                source: "Google Ads",
                notes: "Contract signed! Onboarding scheduled for next Monday.",
                stage: "WON",
                followUpDate: null,
                userId: admin.id
            },
            {
                name: "Lucas Garcia",
                email: "l.garcia@startupspark.net",
                phone: "+1 555-0593",
                source: "Cold Call",
                notes: "Decided to postpone software evaluation until next fiscal quarter.",
                stage: "LOST",
                followUpDate: yesterday,
                userId: admin.id
            }
        ];

        for (const lead of sampleLeads) {
            await prisma.lead.create({ data: lead });
        }
        console.log(`Created ${sampleLeads.length} sample leads across all stages.`);
    } else {
        console.log(`Leads already exist (${count} found), skipping lead creation.`);
    }

    console.log("Seeding completed successfully! 🎉");
}

main()
    .catch((e) => {
        console.error("Error during seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
