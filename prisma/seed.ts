import {prisma} from "@/lib/db";  
import { Role } from "@prisma/client"

async function main() {

    await prisma.user.create({
        data: {
            id: "user1",
            name: "Test User",
            email: "test@test.com"
        }
    });

    await prisma.project.create({
        data: {
            id: "project1",
            name: "Test Project",
        }});

    await prisma.projectMember.create({
        data: {
            id: "membership1",
            userId: "user1",
            projectId: "project1",
            role: Role.OWNER
        }
    });
    
    await prisma.file.create({
        data: {
            id: "file1",
            name: "index.js",
            path: "/index.js",
            content: "console.log('Hello, world!');",
            projectId: "project1"
        }
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());