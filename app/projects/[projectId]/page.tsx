"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import styles from "../../landing.module.css"
import style from "./projectDetails.module.css"



export default function ProjectDetailsPage() {

    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const projectId = params.projectId as string

    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const [activePannel, setActivePanel] = useState<"projectDashboard" | "collaborators" | "settings">("projectDashboard")

    const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("EDITOR")
    const [inviteLink, setInviteLink] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/")
        }
    }, [status])


    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects/${projectId}`)
                if (res.ok) {
                    const data = await res.json()
                    setProject(data)
                } else {
                    console.error("Failed to fetch project")
                }
            } catch (error) {
                console.error("Error fetching project:", error)
            } finally {
                setLoading(false)
            }
        }
        if (!projectId) return
        fetchProject()
    }, [projectId])


    if (status === "loading" || loading) return <div>loading...</div>
    if (!session) return null
    if (!project) return <div>project not found</div>

    const name = session.user?.name

    const myRole = project?.members?.find(
        (m: any) => m.userId === session?.user?.id
    )?.role

    const initial = name?.charAt(0)

    const handleGenerateInvite = async () => {
        setIsGenerating(true)
        fetch(`/api/projects/${projectId}/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: inviteRole })
        })
            .then(res => res.json())
            .then(data => {
                setInviteLink(data.url)
                setIsGenerating(false)
            })
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const refreshProject = () => {
        fetch(`/api/projects/${projectId}`)
            .then(res => res.json())
            .then(data => setProject(data))
    }

    const handleRoleChange = async (memberId: string, newRole: string) => {
        await fetch(`/api/projects/${projectId}/members/${memberId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole })
        })
        refreshProject()
    }

    const handleRemoveMember = async (memberId: string) => {
        await fetch(`/api/projects/${projectId}/members/${memberId}`, {
            method: "DELETE"
        })
        refreshProject()
    }

    return (
        <div>
            <div>
                <div style={{ "position": "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                    <div className={styles.indentGuide} style={{ left: "240px" }}></div>
                    <div className={styles.indentGuide} style={{ right: "80px" }}></div>
                </div>
                {/* NAV */}
                <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, backdropFilter: "blur(12px)", borderBottom: "1px solid #1a1a1a", background: "rgba(5,5,5,0.6)", height: "56px", display: "flex", alignItems: "center" }}>

                    <div style={{ display: "flex", alignItems: "center", padding: "0 25px", height: "100%", width: "100%", maxWidth: "1440px", margin: "0 auto" }}>

                        {/* logo + breadcrumb */}
                        <div style={{ display: "flex", alignItems: "center", gap: "24px", height: "100%" }}>

                            {/* Logo */}
                            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: ".9rem", fontWeight: "bold", color: "#BDC3C7", cursor: "pointer" }} onClick={() => router.push("/dashboard")}>
                                {/* Logo */}
                                <svg
                                    fill="#ffffff"
                                    width="19px"
                                    height="19px"
                                    viewBox="-3.6 -3.6 43.20 43.20"
                                    preserveAspectRatio="xMidYMid meet"
                                    xmlns="http://www.w3.org/2000/svg"
                                    xmlnsXlink="http://www.w3.org/1999/xlink"
                                    stroke="#ffffff"
                                    transform="matrix(1, 0, 0, 1, 0, 0)"
                                    strokeWidth={0.00036}

                                >
                                    <g id="SVGRepo_bgCarrier" strokeWidth={0} />
                                    <g
                                        id="SVGRepo_tracerCarrier"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        stroke="#ffffff"
                                        strokeWidth={0.21600000000000003}
                                    />
                                    <g id="SVGRepo_iconCarrier">
                                        <title>{"terminal-solid"}</title>
                                        <path
                                            d="M32,5H4A2,2,0,0,0,2,7V29a2,2,0,0,0,2,2H32a2,2,0,0,0,2-2V7A2,2,0,0,0,32,5ZM6.8,15.81V13.17l10,4.59v2.08l-10,4.59V21.78l6.51-3ZM23.4,25.4H17V23h6.4ZM4,9.2V7H32V9.2Z"
                                            className="clr-i-solid clr-i-solid-path-1"
                                        />
                                        <rect x={0} y={0} width={36} height={36} fillOpacity={0} />
                                    </g>
                                </svg>
                                collab_ide
                            </span>
                            {/* Breadcrumb */}
                            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "monospace", fontSize: ".7rem", fontWeight: "600", color: "#7F8C8D" }}>
                                / dashboard / projects /
                                <span>{project?.name}</span>
                            </span>
                        </div>
                        {/* buttons */}
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "14px" }}>

                            <button className={style.btnOutline} onClick={() => router.push(`/projects/${projectId}/new-issue`)}>
                                + new_issue()
                            </button>

                            <button className={styles.btnFunc} style={{ background: "#BDC3C7", color: "#000", padding: "5px 14px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", border: "none", cursor: "pointer" }} onClick={() => router.push(`/editor/${projectId}`)}>
                                + open_in_ide()
                            </button>

                        </div>
                    </div>
                </nav>

                {/* LAYOUT */}
                <div className={`relative flex pt-14 min-h-[100vh] z-1`}>
                    {/* SIDEBAR */}
                    <aside className={`${style.sideBar}`}>
                        <div className="flex flex-col">
                            <div className="border-b border-gray-700/50 px-4 py-3 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-zinc-900 text-center flex items-center justify-center px-4 py-4 uppercase text-green-600 text-[16px] font-bold" style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>{`${initial}`}</div>
                                <a className="text-[14px] font-bold lowercase" href="#" style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>{`${session.user?.name}_dev`}</a>

                                {(() => {
                                    const me = project?.members?.find((m: any) => m.userId === session?.user?.id)
                                    if (!me) return null
                                    return (
                                        <div style={{
                                            fontSize: "9px", padding: "2px 8px", borderRadius: "3px", marginBottom: "6px",
                                            background: me.role === "OWNER" ? "rgba(189,195,199,0.1)" : me.role === "EDITOR" ? "rgba(96,165,250,0.1)" : "rgba(127,140,141,0.15)",
                                            color: me.role === "OWNER" ? "#BDC3C7" : me.role === "EDITOR" ? "#60a5fa" : "#7F8C8D"
                                        }}>
                                            {me.role}
                                        </div>
                                    )
                                })()}
                            </div>
                            <div className="flex-1 ">
                                <div className="uppercase mb-3 px-2 text-[10px] px-3" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", letterSpacing: "0.15em", color: "#7F8C8D", marginTop: "10px" }}> project</div>

                                <a href="#" onClick={() => setActivePanel("projectDashboard")} className={`${style.sidebarItem} ${activePannel === "projectDashboard" ? style.sidebarItemActive : ""} flex text-center items-center justify-start gap-3 px-3 py-2`} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
                                    <svg
                                        className={`${style.sidebarIcon}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                        />
                                    </svg>
                                    project_dashboard
                                </a>
                                <a href="#" onClick={() => setActivePanel("collaborators")} className={`${style.sidebarItem} ${activePannel === "collaborators" ? style.sidebarItemActive : ""}  flex text-center items-center justify-start gap-3 px-3 py-2  `} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        className={`${style.sidebarIcon}`}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    collaborators
                                    <span className={`${style.sidebarBadge}`}>6</span>
                                </a>
                            </div>
                            <div className="flex-1 ">
                                <div className="uppercase mb-3 px-2 text-[10px] px-3" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", letterSpacing: "0.15em", color: "#7F8C8D", marginTop: "10px" }}> owner only</div>

                                <a href="#" onClick={() => setActivePanel("settings")} className={`${style.sidebarItem}  ${activePannel === "settings" ? style.sidebarItemActive : ""}  flex text-center items-center  gap-3 px-3 py-2 rounded`} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
                                    <svg
                                        className={`${style.sidebarIcon}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    settings
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* MAIN */}
                    <main className={`${style.main}`}>

                        {activePannel === "projectDashboard" && (
                            <>
                                {/* Project header */}
                                <div className={style.projectHeader}>
                                    <div>
                                        <div className={`${style.projectComment}`} style={{ fontSize: "11px", color: "#7F8C8D", fontFamily: "var(--font-jetbrains-mono)" }}>// project.init()</div>
                                        <div className={`${style.projectTitleArea}`} style={{ display: "flex", alignItems: "center", gap: "16px", margin: "8px 0" }}>
                                            <div className={style.projectIconLg}>{project?.name?.slice(0, 2).toUpperCase()}</div>
                                            <div className={style.projectTitle}>{project?.name}</div>
                                        </div>
                                        <div className={style.projectDesc}>{project?.description || "// No description provided"}</div>
                                    </div>
                                    <div className={style.headerActions}>
                                        <button className={style.btnOutline} onClick={() => router.push(`/projects/${projectId}/new-issue`)}>
                                            + new_issue()
                                        </button>

                                        <button className={styles.btnFunc} style={{ background: "#BDC3C7", color: "#000", padding: "5px 14px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", border: "none", cursor: "pointer" }} onClick={() => router.push(`/editor/${projectId}`)}>
                                            + open_in_ide()
                                        </button>
                                    </div>
                                </div>

                                {/* Stats row */}
                                <div className={style.statRow}>
                                    {/* status, collaborators, files, last updated */}
                                    <div className={`${style.statCard} `}>
                                        <div className={`${style.statLabel}`}><span className={`${style.statDot}`} style={{ background: "#4ade80" }}></span>status</div>
                                        <div className={`${style.statValue} text-green-500`}>Active</div>

                                    </div>
                                    <div className={`${style.statCard} `}>
                                        <div className={`${style.statLabel}`}><span className={`${style.statDot}`} style={{ background: "#60a5fa" }}></span>collaborators</div>
                                        <div className={`${style.statValue}`}>12
                                            <span className=" ml-2 text-[14px] text-green-500"> active</span>
                                        </div>
                                    </div>
                                    <div className={`${style.statCard} `}>
                                        <div className={`${style.statLabel}`}><span className={`${style.statDot}`} style={{ background: "#BDC3C7" }}></span>total_files</div>
                                        <div className={`${style.statValue}`}>12</div>
                                        <div className={`${style.statSub}`}>across all dirs</div>
                                    </div>
                                    <div className={`${style.statCard} `}>
                                        <div className={`${style.statLabel}`}><span className={`${style.statDot}`} style={{ background: "#f59e0b" }}></span>last_commit</div>
                                        <div className={`${style.statValue}`}>2h ago</div>
                                        <div className={`${style.statSub}`}>feat: git integration</div>
                                    </div>
                                </div>



                                <div className={style.contentGrid}>

                                    {/* File Tree panel */}
                                    <div className={style.panel}>
                                        <div className={style.panelHeader}>
                                            <div className={style.panelTitle}>file_structure</div>
                                            <button className={style.panelAction} onClick={() => router.push(`/editor/${projectId}`)}>
                                                + go_to_editor
                                            </button>
                                        </div>
                                        {project?.files?.length === 0 ? (
                                            <div style={{ padding: "20px", fontSize: "11px", color: "#7F8C8D", fontFamily: "var(--font-jetbrains-mono)" }}>
                                              // no files yet — open in ide to create files
                                            </div>
                                        ) : (
                                            project?.files?.map((file: any) => (
                                                <div key={file.id} className={style.fileRow}>
                                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#60a5fa" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <div className={style.fileName}>{file.name}</div>
                                                    <div className={style.fileMsg}>{file.path}</div>
                                                    <div className={style.fileTime}>{new Date(file.updatedAt).toLocaleDateString()}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Collaborators preview panel */}
                                    <div className={style.panel}>
                                        <div className={style.panelHeader}>
                                            <div className={style.panelTitle}>collaborators</div>

                                            <button className={style.panelAction} style={{}} onClick={refreshProject}>
                                                ↻
                                            </button>
                                            {myRole === "OWNER" && (
                                                <button className={style.panelAction} onClick={() => setActivePanel("collaborators")}>
                                                    + invite_member()
                                                </button>
                                            )}
                                        </div>

                                        {myRole === "OWNER" && (
                                            <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a", fontFamily: "var(--font-jetbrains-mono)" }}>
                                                <div style={{ fontSize: "10px", color: "#7F8C8D", marginBottom: "12px" }}>// generate_invite_link()</div>

                                                {/* Role selector */}
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                                    <span style={{ fontSize: "10px", color: "#7F8C8D", width: "40px" }}>role</span>
                                                    <div style={{ display: "flex", gap: "6px" }}>
                                                        {(["EDITOR", "VIEWER"] as const).map(r => (
                                                            <button key={r} onClick={() => setInviteRole(r)} style={{
                                                                fontSize: "10px", padding: "3px 10px", borderRadius: "3px",
                                                                border: `1px solid ${inviteRole === r ? "#BDC3C7" : "#252525"}`,
                                                                background: inviteRole === r ? "#BDC3C7" : "transparent",
                                                                color: inviteRole === r ? "#000" : "#7F8C8D",
                                                                cursor: "pointer", fontFamily: "var(--font-jetbrains-mono)"
                                                            }}>{r}</button>
                                                        ))}
                                                    </div>
                                                    <button onClick={handleGenerateInvite} disabled={isGenerating} style={{
                                                        fontSize: "10px", padding: "3px 12px", borderRadius: "3px",
                                                        border: "1px solid #252525", background: "transparent",
                                                        color: "#7F8C8D", cursor: "pointer", fontFamily: "var(--font-jetbrains-mono)",
                                                        marginLeft: "auto"
                                                    }}>
                                                        {isGenerating ? "generating..." : "generate()"}
                                                    </button>
                                                </div>

                                                {/* Generated link */}
                                                {inviteLink && (
                                                    <>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#111", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "8px 12px" }}>
                                                            <span style={{ flex: 1, fontSize: "10px", color: "#7F8C8D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {inviteLink}
                                                            </span>
                                                            <button onClick={handleCopy} style={{
                                                                fontSize: "10px", color: copied ? "#4ade80" : "#BDC3C7",
                                                                background: "transparent", border: "1px solid #252525",
                                                                padding: "2px 8px", borderRadius: "3px", cursor: "pointer",
                                                                fontFamily: "var(--font-jetbrains-mono)", flexShrink: 0
                                                            }}>
                                                                {copied ? "copied!" : "copy()"}
                                                            </button>
                                                        </div>
                                                        <div style={{ fontSize: "10px", color: "rgba(127,140,141,0.5)", marginTop: "6px" }}>
                                                        // expires in 24h · single use
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {project?.members?.map((member: any) => (
                                            <div key={member.id} style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                padding: "12px 20px",
                                                borderBottom: "1px solid rgba(26,26,26,0.5)",
                                                fontFamily: "var(--font-jetbrains-mono)"
                                            }}>
                                                <div style={{
                                                    width: "28px", height: "28px", borderRadius: "50%",
                                                    background: "#1a1a1a", border: "1px solid #252525",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "10px", fontWeight: "700", color: "#BDC3C7", flexShrink: 0
                                                }}>
                                                    {member?.user?.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: "11px", color: "#ECF0F1", marginBottom: "2px" }}>
                                                        {member?.user?.name}
                                                    </div>
                                                    <div style={{ fontSize: "10px", color: "#7F8C8D" }}>
                                                        {member?.user?.email}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    width: "6px", height: "6px", borderRadius: "50%",
                                                    background: "#252525", flexShrink: 0
                                                }}></div>
                                                <div style={{
                                                    fontSize: "9px", padding: "2px 8px", borderRadius: "3px",
                                                    background: member.role === "OWNER" ? "rgba(189,195,199,0.1)" : member.role === "EDITOR" ? "rgba(96,165,250,0.1)" : "rgba(127,140,141,0.15)",
                                                    color: member.role === "OWNER" ? "#BDC3C7" : member.role === "EDITOR" ? "#60a5fa" : "#7F8C8D"
                                                }}>
                                                    {member.role}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Comments */}
                                <div className={style.panel} style={{ marginTop: "24px" }}>
                                    <div className={style.panelHeader}>
                                        <div className={style.panelTitle}>comments</div>
                                        <span style={{ fontSize: "10px", color: "#7F8C8D", fontFamily: "var(--font-jetbrains-mono)" }}>3 threads</span>
                                    </div>

                                    {/* Comment rows */}
                                    <div style={{ display: "flex", gap: "12px", padding: "14px 20px", borderBottom: "1px solid rgba(26,26,26,0.5)" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#1a1a1a", border: "1px solid #252525", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", color: "#BDC3C7", flexShrink: 0 }}>K</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "10px", color: "#7F8C8D", marginBottom: "4px", fontFamily: "var(--font-jetbrains-mono)" }}>
                                                <span style={{ color: "#BDC3C7" }}>kaivalyakulkarni_dev</span> · 2h ago
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#ECF0F1", lineHeight: "1.6", fontFamily: "var(--font-jetbrains-mono)" }}>
                                             // Added git integration with isomorphic-git. The /tmp filesystem pattern works well on Vercel.
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "12px", padding: "14px 20px", borderBottom: "1px solid rgba(26,26,26,0.5)" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#1a1a1a", border: "1px solid #252525", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", color: "#BDC3C7", flexShrink: 0 }}>A</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "10px", color: "#7F8C8D", marginBottom: "4px", fontFamily: "var(--font-jetbrains-mono)" }}>
                                                <span style={{ color: "#BDC3C7" }}>ishu2022_dev</span> · 5h ago
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#ECF0F1", lineHeight: "1.6", fontFamily: "var(--font-jetbrains-mono)" }}>
                                             // Tested Docker terminal on Windows — node:18-alpine pulls correctly.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comment input */}
                                    <div style={{ display: "flex", gap: "10px", padding: "14px 20px", alignItems: "flex-end", borderTop: "1px solid #1a1a1a" }}>
                                        <textarea
                                            placeholder="// add_comment()..."
                                            style={{
                                                flex: 1, background: "#111", border: "1px solid #1a1a1a",
                                                borderRadius: "4px", padding: "8px 12px", fontSize: "11px",
                                                color: "#ECF0F1", fontFamily: "var(--font-jetbrains-mono)",
                                                outline: "none", resize: "none", rows: 2
                                            } as any}
                                            rows={2}
                                        />
                                        <button style={{
                                            background: "#BDC3C7", color: "#000", border: "none",
                                            padding: "8px 16px", borderRadius: "4px", fontSize: "11px",
                                            fontWeight: "700", cursor: "pointer", fontFamily: "var(--font-jetbrains-mono)",
                                            flexShrink: 0
                                        }}>
                                            add_comment()
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {activePannel === "collaborators" && (
                            <>
                                {/* Section header */}
                                <div className={style.sectionHeader} style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                                    <div className={style.sectionTitle}>collaborators</div>
                                    <button onClick={refreshProject} style={{
                                        fontSize: "10px", color: "#7F8C8D", background: "transparent",
                                        border: "1px solid #252525", padding: "3px 10px", borderRadius: "3px",
                                        cursor: "pointer", fontFamily: "var(--font-jetbrains-mono)"
                                    }}>↻ refresh()</button>
                                </div>

                                <div className={style.panel}>
                                    {/* Invite section — owner only */}
                                    {myRole === "OWNER" && (
                                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a", fontFamily: "var(--font-jetbrains-mono)" }}>
                                            <div style={{ fontSize: "10px", color: "#7F8C8D", marginBottom: "12px" }}>// generate_invite_link()</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                                <span style={{ fontSize: "10px", color: "#7F8C8D", width: "40px" }}>role</span>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    {(["EDITOR", "VIEWER"] as const).map(r => (
                                                        <button key={r} onClick={() => setInviteRole(r)} style={{
                                                            fontSize: "10px", padding: "3px 10px", borderRadius: "3px",
                                                            border: `1px solid ${inviteRole === r ? "#BDC3C7" : "#252525"}`,
                                                            background: inviteRole === r ? "#BDC3C7" : "transparent",
                                                            color: inviteRole === r ? "#000" : "#7F8C8D",
                                                            cursor: "pointer", fontFamily: "var(--font-jetbrains-mono)"
                                                        }}>{r}</button>
                                                    ))}
                                                </div>
                                                <button onClick={handleGenerateInvite} disabled={isGenerating} style={{
                                                    fontSize: "10px", padding: "3px 12px", borderRadius: "3px",
                                                    border: "1px solid #252525", background: "transparent",
                                                    color: "#7F8C8D", cursor: "pointer", fontFamily: "var(--font-jetbrains-mono)",
                                                    marginLeft: "auto"
                                                }}>
                                                    {isGenerating ? "generating..." : "generate()"}
                                                </button>
                                            </div>
                                            {inviteLink && (
                                                <>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#111", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "8px 12px" }}>
                                                        <span style={{ flex: 1, fontSize: "10px", color: "#7F8C8D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {inviteLink}
                                                        </span>
                                                        <button onClick={handleCopy} style={{
                                                            fontSize: "10px", color: copied ? "#4ade80" : "#BDC3C7",
                                                            background: "transparent", border: "1px solid #252525",
                                                            padding: "2px 8px", borderRadius: "3px", cursor: "pointer",
                                                            fontFamily: "var(--font-jetbrains-mono)", flexShrink: 0
                                                        }}>
                                                            {copied ? "copied!" : "copy()"}
                                                        </button>
                                                    </div>
                                                    <div style={{ fontSize: "10px", color: "rgba(127,140,141,0.5)", marginTop: "6px" }}>
                                                      // expires in 24h · single use
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Members list */}
                                    {project?.members?.map((member: any) => (
                                        <div key={member.id} style={{
                                            display: "flex", alignItems: "center", gap: "12px",
                                            padding: "14px 20px", borderBottom: "1px solid rgba(26,26,26,0.5)",
                                            fontFamily: "var(--font-jetbrains-mono)"
                                        }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: "32px", height: "32px", borderRadius: "50%",
                                                background: "#1a1a1a", border: "1px solid #252525",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "11px", fontWeight: "700", color: "#BDC3C7", flexShrink: 0
                                            }}>
                                                {member?.user?.name?.charAt(0).toUpperCase()}
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: "12px", color: "#ECF0F1", marginBottom: "2px" }}>
                                                    {member?.user?.name}
                                                </div>
                                                <div style={{ fontSize: "10px", color: "#7F8C8D" }}>
                                                    {member?.user?.email}
                                                </div>
                                            </div>

                                            {/* Online dot */}
                                            <div style={{
                                                width: "6px", height: "6px", borderRadius: "50%",
                                                background: "#252525", flexShrink: 0
                                            }}></div>

                                            {/* Role — static for owner, dropdown + remove for others */}
                                            {member.role === "OWNER" ? (
                                                <div style={{
                                                    fontSize: "9px", padding: "2px 8px", borderRadius: "3px",
                                                    background: "rgba(189,195,199,0.1)", color: "#BDC3C7"
                                                }}>OWNER</div>
                                            ) : myRole === "OWNER" ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <select
                                                        value={member.role}
                                                        onChange={e => handleRoleChange(member.id, e.target.value)}
                                                        style={{
                                                            background: "#111", border: "1px solid #252525",
                                                            borderRadius: "3px", color: "#7F8C8D", fontSize: "10px",
                                                            padding: "2px 6px", fontFamily: "var(--font-jetbrains-mono)",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        <option value="EDITOR">EDITOR</option>
                                                        <option value="VIEWER">VIEWER</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleRemoveMember(member.id)}
                                                        style={{
                                                            background: "rgba(248,113,113,0.1)", color: "#f87171",
                                                            border: "1px solid rgba(248,113,113,0.3)",
                                                            padding: "2px 8px", borderRadius: "3px", fontSize: "10px",
                                                            cursor: "pointer", fontFamily: "var(--font-jetbrains-mono)"
                                                        }}
                                                    >
                                                        remove()
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    fontSize: "9px", padding: "2px 8px", borderRadius: "3px",
                                                    background: member.role === "EDITOR" ? "rgba(96,165,250,0.1)" : "rgba(127,140,141,0.15)",
                                                    color: member.role === "EDITOR" ? "#60a5fa" : "#7F8C8D"
                                                }}>{member.role}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </main>

                </div>

                {/* Status-Bar */}
                <div className={`${style.statusbar}`} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
                    <div className={`${style.statusItem}`}><span className={`${style.statusActiveDot}`}></span>connected</div>
                    <div className={`${style.statusItem}`}><span>{project?.name}</span></div>
                    <div className={`${style.statusItem}`}>TypeScript</div>
                    <div className={`${style.statusItem} ml-auto`}>COLLAB_IDE_DASHBOARD_V1.0</div>
                </div>
            </div>
        </div>
    )
}