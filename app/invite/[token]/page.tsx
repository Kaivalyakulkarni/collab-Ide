"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"

export default function InvitePage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const token = params.token as string

    const [invite, setInvite] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [error, setError] = useState("")

    // 1. fetch invite details useEffect
    useEffect(() => {
        if (status === "loading") return
        if (status === "unauthenticated") {
            router.push(`/?callbackUrl=/invite/${token}`)  // ← your auth is on "/" not "/auth/signin"
            return
        }
        // fetch invite details when authenticated
        fetch(`/api/invite/${token}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) setError(data.error)
                else setInvite(data)
                setLoading(false)
            })
            .catch(() => {
                setError("Invalid or expired invite link")
                setLoading(false)
            })
    }, [status, token])

    // 2. handle accept function
    const handleAccept = async () => {
        setJoining(true)
        try {
            const res = await fetch(`/api/invite/${token}/accept`, {
                method: "POST"
            })
            if (!res.ok) throw new Error("Failed to join project")
            const data = await res.json()
            router.push(`/projects/${data.projectId}`)
        } catch (err: any) {
            setError(err.message)
            setJoining(false)
        }
    }
    if (loading) return <div>loading...</div>
    if (error) return <div>{error}</div>

    return (
        <div>
            {/* invite acceptance UI */}
            <div style={{
                background: "#050505",
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                backgroundImage: "linear-gradient(rgba(189,195,199,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(189,195,199,0.03) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
            }}>
                <div style={{
                    background: "#0a0a0a",
                    border: "1px solid #1a1a1a",
                    borderRadius: "8px",
                    padding: "40px",
                    width: "480px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px"
                }}>
                    {/* Header */}
                    <div>
                        <div style={{ fontSize: "11px", color: "#7F8C8D", marginBottom: "8px" }}>// invite.accept()</div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#ECF0F1", marginBottom: "4px" }}>
                            you've been invited
                        </div>
                        <div style={{ fontSize: "12px", color: "rgba(127,140,141,0.6)" }}>
                            join a collaborative project on collab_ide
                        </div>
                    </div>

                    {/* Project info */}
                    <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "16px" }}>
                        <div style={{ fontSize: "10px", color: "#7F8C8D", marginBottom: "8px", letterSpacing: "0.12em", textTransform: "uppercase" }}>project</div>
                        <div style={{ fontSize: "18px", fontWeight: "700", color: "#ECF0F1", marginBottom: "4px" }}>{invite?.projectName}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                            <div style={{ fontSize: "10px", color: "#7F8C8D" }}>your role:</div>
                            <div style={{
                                fontSize: "10px", padding: "2px 8px", borderRadius: "3px",
                                background: invite?.role === "EDITOR" ? "rgba(96,165,250,0.1)" : "rgba(127,140,141,0.15)",
                                color: invite?.role === "EDITOR" ? "#60a5fa" : "#7F8C8D"
                            }}>{invite?.role}</div>
                        </div>
                        <div style={{ fontSize: "10px", color: "rgba(127,140,141,0.4)", marginTop: "8px" }}>
                    // expires: {new Date(invite?.expiresAt).toLocaleString()}
                        </div>
                    </div>

                    {/* Logged in as */}
                    <div style={{ fontSize: "11px", color: "#7F8C8D" }}>
                        joining as: <span style={{ color: "#BDC3C7" }}>{session?.user?.name}</span>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            onClick={() => router.push("/dashboard")}
                            style={{
                                flex: 1, background: "transparent", color: "#7F8C8D",
                                border: "1px solid #252525", padding: "10px", borderRadius: "4px",
                                fontSize: "12px", cursor: "pointer", fontFamily: "var(--font-jetbrains-mono)"
                            }}>
                            decline()
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={joining}
                            style={{
                                flex: 2,
                                background: joining ? "#7F8C8D" : "#BDC3C7",
                                color: "#000", border: "none", padding: "10px",
                                borderRadius: "4px", fontSize: "12px", fontWeight: "700",
                                cursor: joining ? "not-allowed" : "pointer",
                                fontFamily: "var(--font-jetbrains-mono)"
                            }}>
                            {joining ? "joining..." : "accept_invite()"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}