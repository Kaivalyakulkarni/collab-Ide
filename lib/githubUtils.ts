export function slugifyRepoName(name: string): string {
    return (
        name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "") || "project"
    )
}

export function toRepoPath(filePath: string): string {
    return filePath
        .split("/")
        .filter(Boolean)
        .slice(1)
        .join("/")
}