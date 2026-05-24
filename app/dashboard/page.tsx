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
    
    const name =  session.user?.name
    const initial = name?.charAt(0)

    return (
        <div>
            {/* Indentation Guides */}
            <div style={{ "position": "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                <div className={styles.indentGuide} style={{ left: "230px" }}></div>
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
                            <a href="#" className={`${styles.navTab} ${styles.navTabActive}`} style={{ padding: "0 20px", height: "40px", display: "flex", alignItems: "center", fontSize: "12px", fontFamily: "var(--font-jetbrains-mono),monospace" ,gap:"8px"}}>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                dashboard.tsx
                            </a>
                            <a href="#" className={`${styles.navTab} ${styles.navTabInActive}`} style={{ padding: "0 20px", height: "40px", display: "flex", alignItems: "center", fontSize: "12px", fontFamily: "var(--font-jetbrains-mono),monospace" ,gap:"8px"}}>
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                projects.json
                            </a>
                            <a href="#" className={`${styles.navTab} ${styles.navTabInActive}`} style={{ padding: "0 20px", height: "40px", display: "flex", alignItems: "center", fontSize: "12px", fontFamily: "var(--font-jetbrains-mono),monospace" ,gap:"8px"}}>
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
                                settings.ts
                            </a>
                        </div>
                    </div>

                    {/* Auth Buttons */}
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "14px" }}>

                        <a href="#" className=" text-[13px] lowercase text-gray-500 flex gap-2 items-center" style={{fontFamily: "var(--font-jetbrains-mono),monospace"}}>
                           <div className="w-6 h-6 rounded-full bg-zinc-900 text-center flex items-center justify-center px-4 py-4 uppercase text-green-600 text-[12px] font-bold">{`${initial}`}</div>
                            {`${session.user?.name}_dev` }
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
                <aside className="flex-shrink-0 flex flex-column" style={{width: "230px", padding:"24px 0",background:"rgba(10,10,10,0.6)",}}>

                </aside>
            </div>
            

        </div>
    )
}