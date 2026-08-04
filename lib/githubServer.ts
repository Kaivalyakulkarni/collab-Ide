import crypto from "crypto"
import { slugifyRepoName } from "@/lib/githubUtils"

export function gitBlobSha(content: string): string {
    const bytes = Buffer.from(content, "utf-8")
    const header = `blob ${bytes.length}\0`
    const store = Buffer.concat([Buffer.from(header, "utf-8"), bytes])
    return crypto.createHash("sha1").update(store).digest("hex")
}

type CreateRepoSuccess = {
    githubRepoId: number
    githubFullName: string
    githubBranch: string
}

type CreateRepoError = {
    error: string
}

type CreateRepoResult = CreateRepoSuccess | CreateRepoError

export async function createGithubRepoForUser(params: {
    accessToken: string
    name: string
    description?: string
}): Promise<CreateRepoResult> {
    const repoName = slugifyRepoName(params.name)

    const res = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${params.accessToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: repoName,
            description: params.description || undefined,
            private: true,
            auto_init: true,
        }),
    })

    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        return { error: errBody?.message || "Unknown GitHub API error" }
    }

    const repo = await res.json()
    return {
        githubRepoId: repo.id,
        githubFullName: repo.full_name,
        githubBranch: repo.default_branch || "main",
    }
}