"use client"

import React from "react"
import { useState } from "react"


interface GitPanelProps {
    projectId: string
}


const GitPanel: React.FC<GitPanelProps> = ({ projectId }) => {
    const [isInitialized, setIsInitialized] = useState(false)
    const [changedFiles, setChangedFiles] = useState<string[]>([])
    const [commitMessage, setCommitMessage] = useState("")

    const initializeGitRepository = async () => {
        // Implementation for initializing Git repository

        const response = await fetch(`/api/projects/${projectId}/git/init`, {
            method: "POST",
        })
        if (response.ok) {
            setIsInitialized(true)
        }
        else { console.error("Failed to initialize Git repository") }

    }

    const fetchStatus = async () => {
        const response = await fetch(`/api/projects/${projectId}/git/status`)
        if (response.ok) {
            const statusData = await response.json()
            setChangedFiles(statusData.changedFiles)
        }
        else { console.error("Failed to fetch Git status") }
    }

    const commitChanges = async () => {
        const response = await fetch(`/api/projects/${projectId}/git/commit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: commitMessage })
        })
        if (response.ok) {
            setCommitMessage("")
            await fetchStatus()
        }
        else { console.error("Failed to commit changes") }
    }




    return (
        <div className="p-4">
            {!isInitialized && (
                <button onClick={initializeGitRepository}>
                    Initialize Git Repository
                </button>
            )}

            {isInitialized && (
                <div>
                    <button onClick={fetchStatus}>Refresh Status</button>
                    <h3>Changed Files:</h3>
                    <ul>
                        {changedFiles.map((file, index) => (
                            <li key={index}>{file}</li>
                        ))}
                    </ul>
                </div>
            )}    

            {isInitialized && (
                <div>
                    <h3>Commit Changes</h3>
                    <textarea
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Enter commit message"
                    />
                    <button onClick={commitChanges}>Commit</button>
                </div>
            )}    
        </div>
    )
}

export default GitPanel