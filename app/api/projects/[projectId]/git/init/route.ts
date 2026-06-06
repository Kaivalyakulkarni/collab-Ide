
import git from 'isomorphic-git'
import * as fs from 'fs'
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";



export async function POST(
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await context.params;

    try {
        const files = await prisma.file.findMany({
            where: { projectId },
        });

        const dir = `/tmp/project-${projectId}/`;
        await fs.promises.mkdir(dir, { recursive: true });
        
        for (const file of files) {
            const filePath = `${dir}${file.name}`;
            await fs.promises.writeFile(filePath, file.content ?? "");
        }
        await git.init({ fs, dir });
        return new Response(JSON.stringify({ message: "Git repository initialized successfully" }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to initialize git repository" }), { status: 500 });
    }

}
