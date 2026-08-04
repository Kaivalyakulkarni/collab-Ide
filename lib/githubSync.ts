import { prisma } from "@/lib/db"
import { gitBlobSha } from "@/lib/githubServer"
import { toRepoPath } from "@/lib/githubUtils"

type SyncResult =
    | { success: true; commitSha: string; filesChanged: number }
    | { success: false; error: string }

export async function performGithubCommit(params: {
    projectId: string
    message: string
}): Promise<SyncResult> {
    const { projectId, message } = params

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { files: true, members: true },
    })

    if (!project || !project.githubFullName || !project.githubBranch) {
        return { success: false, error: "Project is not linked to GitHub" }
    }

    // find an owner's github connection to use for pushing —
    // any member could trigger a commit, but we push using the
    // linked repo owner's token since that's who authorized repo creation
    const ownerMembership = project.members.find(m => m.role === "OWNER")
    if (!ownerMembership) {
        return { success: false, error: "Project has no owner" }
    }

    const connection = await prisma.githubConnection.findUnique({
        where: { userId: ownerMembership.userId },
    })

    if (!connection) {
        return { success: false, error: "GitHub connection not found for project owner" }
    }

    const token = connection.accessToken
    const fullName = project.githubFullName
    const branch = project.githubBranch

    const ghHeaders = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
    }

    // 1. figure out which files actually changed
    const trackedFiles = project.files.filter(f => f.type === "file")
    const changed = trackedFiles.filter(f => {
        const localSha = gitBlobSha(f.content ?? "")
        return localSha !== f.githubBlobSha
    })

    if (changed.length === 0) {
        return { success: false, error: "No changes to commit" }
    }

    // 2. get the current branch ref -> current commit -> its tree
    const refRes = await fetch(
        `https://api.github.com/repos/${fullName}/git/ref/heads/${branch}`,
        { headers: ghHeaders }
    )
    if (!refRes.ok) return { success: false, error: "Failed to read branch ref" }
    const refData = await refRes.json()
    const parentCommitSha = refData.object.sha

    const parentCommitRes = await fetch(
        `https://api.github.com/repos/${fullName}/git/commits/${parentCommitSha}`,
        { headers: ghHeaders }
    )
    if (!parentCommitRes.ok) return { success: false, error: "Failed to read parent commit" }
    const parentCommitData = await parentCommitRes.json()
    const baseTreeSha = parentCommitData.tree.sha

    // 3. create a blob for each changed file
    const treeEntries: { path: string; mode: string; type: string; sha: string }[] = []

    for (const file of changed) {
        const blobRes = await fetch(
            `https://api.github.com/repos/${fullName}/git/blobs`,
            {
                method: "POST",
                headers: ghHeaders,
                body: JSON.stringify({
                    content: file.content ?? "",
                    encoding: "utf-8",
                }),
            }
        )
        if (!blobRes.ok) {
            return { success: false, error: `Failed to create blob for ${file.name}` }
        }
        const blobData = await blobRes.json()

        treeEntries.push({
            path: toRepoPath(file.path),
            mode: "100644",
            type: "blob",
            sha: blobData.sha,
        })
    }

    // 4. create a new tree, layered on top of the existing one
    const treeRes = await fetch(
        `https://api.github.com/repos/${fullName}/git/trees`,
        {
            method: "POST",
            headers: ghHeaders,
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: treeEntries,
            }),
        }
    )
    if (!treeRes.ok) return { success: false, error: "Failed to create tree" }
    const treeData = await treeRes.json()

    // 5. create the commit
    const commitRes = await fetch(
        `https://api.github.com/repos/${fullName}/git/commits`,
        {
            method: "POST",
            headers: ghHeaders,
            body: JSON.stringify({
                message,
                tree: treeData.sha,
                parents: [parentCommitSha],
            }),
        }
    )
    if (!commitRes.ok) return { success: false, error: "Failed to create commit" }
    const commitData = await commitRes.json()

    // 6. move the branch ref forward to the new commit
    const updateRefRes = await fetch(
        `https://api.github.com/repos/${fullName}/git/refs/heads/${branch}`,
        {
            method: "PATCH",
            headers: ghHeaders,
            body: JSON.stringify({ sha: commitData.sha }),
        }
    )
    if (!updateRefRes.ok) return { success: false, error: "Failed to update branch ref" }

    // 7. record the new blob SHAs so status checks stay accurate
    await Promise.all(
        changed.map((file, i) =>
            prisma.file.update({
                where: { id: file.id },
                data: { githubBlobSha: treeEntries[i].sha },
            })
        )
    )

    return { success: true, commitSha: commitData.sha, filesChanged: changed.length }
}