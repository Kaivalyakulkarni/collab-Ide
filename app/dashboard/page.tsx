"use client"

import { useEffect, useRef } from "react"
import { redirect, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import styles from "../landing.module.css"
import style from "./dashboard.module.css"
import { relative } from "path"


export default function Dashboard() {


    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status])

    if (status === "loading") { return <div>Loading...</div> }
    if (!session) return null;

    const name = session.user?.name
    const initial = name?.charAt(0)

    return (
        <div>
            {/* Indentation Guides */}
            <div style={{ "position": "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                <div className={styles.indentGuide} style={{ left: "240px" }}></div>
                <div className={styles.indentGuide} style={{ right: "80px" }}></div>
            </div>

            {/* NavBar */}
            <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, backdropFilter: "blur(12px)", borderBottom: "1px solid #1a1a1a", background: "rgba(5,5,5,0.6)", height: "56px", display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "0 25px", height: "100%", width: "100%", maxWidth: "1440px", margin: "0 auto" }}>

                    {/* Logo + tabs */}
                    <div style={{ display: "flex", alignItems: "center", gap: "24px", height: "100%" }}>

                        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: ".9rem", fontWeight: "bold", color: "#BDC3C7" }}>
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
                        <div style={{ display: "flex", height: "100%", alignItems: "flex-end" }} className="hiddden md:flex">
                            <a href="#" className={`${styles.navTab} ${styles.navTabActive}`} style={{ padding: "0 20px", height: "40px", display: "flex", alignItems: "center", fontSize: "12px", fontFamily: "var(--font-jetbrains-mono),monospace", gap: "8px" }}>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                dashboard.tsx
                            </a>
                            <a href="#" className={`${styles.navTab} ${styles.navTabInActive}`} style={{ padding: "0 20px", height: "40px", display: "flex", alignItems: "center", fontSize: "12px", fontFamily: "var(--font-jetbrains-mono),monospace", gap: "8px" }}>
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                projects.json
                            </a>
                            <a href="#" className={`${styles.navTab} ${styles.navTabInActive}`} style={{ padding: "0 20px", height: "40px", display: "flex", alignItems: "center", fontSize: "12px", fontFamily: "var(--font-jetbrains-mono),monospace", gap: "8px" }}>
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
                                settings.ts
                            </a>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "14px" }}>

                        <a href="#" className=" text-[13px] lowercase text-gray-500 flex gap-2 items-center" style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
                            <div className="w-6 h-6 rounded-full bg-zinc-900 text-center flex items-center justify-center px-4 py-4 uppercase text-green-600 text-[12px] font-bold">{`${initial}`}</div>
                            {`${session.user?.name}_dev`}
                        </a>

                        <button className={styles.btnFunc} style={{ background: "#BDC3C7", color: "#000", padding: "5px 14px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", border: "none", cursor: "pointer" }}>
                            + new_project()
                        </button>
                    </div>
                </div>
            </nav>

            {/* Layout */}
            <div className={`relative flex pt-14 min-h-[100vh] z-1`}>
                {/* SideBar */}
                <aside className={`${style.sideBar}`}>
                    <div className="px-4 mb-8">
                        <div className="uppercase mb-3 px-2 text-[10px]" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", letterSpacing: "0.15em", color: "#7F8C8D" }}> workspace</div>
                        <a href="#" className={`${style.sidebarItem} ${style.sidebarItemActive} flex text-center items-center justify-center gap-3 px-3 py-2 rounded `} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
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
                            overview
                            <span className={`${style.sidebarBadge}`}>3</span>
                        </a>
                        <a href="#" className={`${style.sidebarItem}  flex text-center items-center justify-center gap-3 px-3 py-2 rounded `} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
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
                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                            </svg>
                            projects
                            <span className={`${style.sidebarBadge}`}>3</span>
                        </a>
                        <a href="#" className={`${style.sidebarItem} flex text-center items-center justify-center gap-3 px-3 py-2 rounded `} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
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
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            collaborators
                            <span className={`${style.sidebarBadge}`}>0</span>
                        </a>
                    </div>
                    <div className={`${style.sidebarSection}`}>
                        <div className={`${style.sidebarLabel}`} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>recent</div>
                        <a href="#" className={`${style.sidebarItem}  flex text-center items-center  gap-3 px-3 py-2 rounded `} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
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
                                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                />
                            </svg>
                            collab-ide
                        </a>
                        <a href="#" className={`${style.sidebarItem}  flex text-center items-center  gap-3 px-3 py-2 rounded`} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
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
                                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                />
                            </svg>
                            flask-contrib
                        </a>
                        <a href="#" className={`${style.sidebarItem}  flex text-center items-center  gap-3 px-3 py-2 rounded`} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
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
                                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                />
                            </svg>
                            portfolio-v3
                        </a>
                    </div>
                    <div className={`${style.sidebarSection}`}>
                        <div className={`${style.sidebarLabel}`} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>system</div>
                        <a href="#" className={`${style.sidebarItem}  flex text-center items-center  gap-3 px-3 py-2 rounded`} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
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
                            setting
                        </a>
                        <a href="#" className={`${style.sidebarItem} flex text-center items-center  gap-3 px-3 py-2 rounded `} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
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
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            logout{"()"}
                        </a>
                    </div>
                </aside>
                {/* Main */}
                <div>
                    
                </div>
            </div>
            {/* Status-Bar */}
            <div className={`${style.statusbar}`} style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}>
                <div className={`${style.statusItem}`}><span className={`${style.statusActiveDot}`}></span>connected</div>
                <div className={`${style.statusItem}`}>collab-ide</div>
                <div className={`${style.statusItem}`}>TypeScript</div>
                <div className={`${style.statusItem} ml-auto`}>COLLAB_IDE_DASHBOARD_V1.0</div>
            </div>
        </div>
    )
}