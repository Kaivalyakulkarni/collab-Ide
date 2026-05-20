import git from 'isomorphic-git'
import * as fs from 'fs'
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";


export async function GET(
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await context.params;

    try {

        const dir = `/tmp/project-${projectId}/`;

        const status = await git.statusMatrix({ fs, dir });

        const changed = status.filter(([filePath, head ,workdir,stage]) => workdir !== 0);
        
        return new Response(JSON.stringify({ changedFiles: changed.map(([filePath]) => filePath) }), { status: 200 });

    

    } catch (error) {
        if ((error as any).code === 'NOT_FOUND') {
            return new Response(JSON.stringify({error: "Git repository not found. Please initialize the repository first."}), { status: 404 });
        }
        return new Response(JSON.stringify({ error: "Failed to get git status" }), { status: 500 });
    }

}