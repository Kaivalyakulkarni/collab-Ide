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
        const dir = `/tmp/project-${projectId}/`;

        const { message } = await request.json();

        const files = await prisma.file.findMany({
            where: { projectId },
        });

        await fs.promises.mkdir(dir, { recursive: true });

        for (const file of files) {
                const filePath = `${dir}${file.name}`;
                await fs.promises.writeFile(filePath, file.content);
                await git.add({fs,dir,filepath: file.name})
        }
        await git.commit({ fs, dir, message, author: { name: 'User', email: 'user@collabide.com' } });
        return new Response(JSON.stringify({ message: "Changes committed successfully" }), { status: 200 });
        
    } catch (error) {
        if ((error as any).code === 'NOT_FOUND') {
            return new Response(JSON.stringify({ error: "Git repository not found. Please initialize the repository first." }), { status: 404 });
        }
        return new Response(JSON.stringify({ error: "Failed to commit changes" }), { status: 500 });
    }
}   
