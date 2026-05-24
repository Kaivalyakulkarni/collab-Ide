"use client";

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react";
import { useEffect, useRef } from "react";
import styles from "./landing.module.css";


export default function Home() {
  const revealRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.revealActive)
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    revealRefs.current.forEach(el => { if (el) observer.observe(el) })

    return () => observer.disconnect()
  }, [])

  const addRevealRef = (el: HTMLDivElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/dashboard")
    }
  }, [session])

  return (
    <div>
      {/* Indentation Guidelines */}
      <div style={{ "position": "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div className={styles.indentGuide} style={{ left: "80px" }}></div>
        <div className={`${styles.indentGuide} hidden md:block`} style={{ left: "120px" }}></div>
        <div className={styles.indentGuide} style={{ right: "80px" }}></div>
      </div>

      {/* NavBar */}
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, backdropFilter: "blur(12px)", borderBottom: "1px solid #1a1a1a", background: "rgba(5,5,5,0.6)", height: "56px", display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 20px", height: "100%", width: "100%", maxWidth: "1440px", margin: "0 auto" }}>

          {/* Logo + tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", height: "100%" }}>

            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "JetBrains Mono, monospace", fontSize: "1rem", fontWeight: "bold", color: "#BDC3C7" }}>
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
              <a href="#" className={`${styles.navTab} ${styles.navTabActive}`} style={{ padding: "0 24px", height: "40px", display: "flex", alignItems: "center", fontSize: "12px", fontFamily: "monospace" }}>
                features.tsx
              </a>
              <a href="#" className={`${styles.navTab} ${styles.navTabInActive}`} style={{ padding: "0 24px", height: "40px", display: "flex", alignItems: "center", fontSize: "12px", fontFamily: "monospace" }}>
                pricing.json
              </a>
              <a href="#" className={`${styles.navTab} ${styles.navTabInActive}`} style={{ padding: "0 24px", height: "40px", display: "flex", alignItems: "center", fontSize: "12px", fontFamily: "monospace" }}>
                docs.md
              </a>
            </div>
          </div>

          {/* Auth Buttons */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => signIn("github", { callbackUrl: "/dashboard" })} style={{ fontFamily: "monospace", fontSize: "13px", color: "#7F8C8D", background: "none", border: "none", cursor: "pointer" }}>
              login()
            </button>
            <button onClick={() => signIn("github", { callbackUrl: "/dashboard" })} className={styles.btnFunc} style={{ background: "#BDC3C7", color: "#000", padding: "6px 16px", borderRadius: "4px", fontSize: "13px", fontWeight: "bold", border: "none", cursor: "pointer" }}>
              getStarted()
            </button>
          </div>
        </div>
      </nav>


      {/* Hero Section */}
      <main className="relative z-10 pt-20">

        {/* Hero Content */}
        <section className="px-10 md:px-40" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }} >
          <div style={{ width: "100%", maxWidth: "900px" }}>
            <div className={styles.codeGlass} style={{ borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ background: "rgba(26, 26, 26, 0.5)", padding: "16px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-800"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-800"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-800"></div>
                </div>
                <span className="ml-4 font-mono text-[11px] text-on-surrface-varient tracking-wide uppercase text-gray-400">
                  src/components/Hero.tsx
                </span>
              </div>
              <div className="p-4 md:p-13 font-mono">
                <div className="mb-10">
                  <span className={styles.syntaxComment} style={{ display: "block", marginBottom: "1rem" }} >/**<br />* @version 2.0.0 <br />* @theme Technical-Silver <br />*/ </span>
                  {/* line 1 */}
                  <div className="flex items-start gap-4">
                    <span style={{ color: "rgba(127, 140, 141, 0.3)", userSelect: "none", width: "32px", textAlign: "right" }}>01</span>
                    <div>
                      <span className={styles.syntaxKeyword}>const</span><span className={styles.syntaxFunc}> Headline </span>
                      {"= () => {"}
                    </div>
                  </div>
                  {/* line 2 */}
                  <div className="flex items-start gap-4 mt-4">
                    <span style={{ color: "rgba(127, 140, 141, 0.3)", userSelect: "none", width: "32px", textAlign: "right" }}>02</span>
                    <div className="pl-8">
                      <span className={styles.syntaxKeyword}>return</span>{" ("}
                    </div>
                  </div>
                  {/* line 3 */}
                  <div className="flex items-start gap-4 mt-4">
                    <span className="mx-3" style={{ color: "rgba(127, 140, 141, 0.3)", userSelect: "none", width: "32px", textAlign: "right" }}>03</span>
                    <div className="pl-16">
                      <h1 className="text-[45px] md:text-[84px] font-bold font-sans tracking-tight leading-none text-on-surface">
                        Code Together,
                        <span className={styles.syntaxPrimary}> Faster</span> than Ever.
                      </h1>
                    </div>
                  </div>
                  {/* line 4 */}
                  <div className="flex items-start gap-4 mt-8">
                    <span style={{ color: "rgba(127, 140, 141, 0.3)", userSelect: "none", width: "32px", textAlign: "right" }}>04</span>
                    <div className="pl-16">
                      <p className="font-sans text-[18px] text-on-surface-variant max-w-xl leading-relaxed mx-3">
                        The high-performance collaborative IDE for modern engineering teams. Real-time
                        synchronization, isolated Docker environments.
                      </p>
                    </div>
                  </div>
                  {/* line 5 */}
                  <div className="flex items-start gap-4 mt-12">
                    <span style={{ color: "rgba(127, 140, 141, 0.3)", userSelect: "none", width: "32px", textAlign: "right" }}>05</span>
                    <div className="pl-16 flex flex-wrap gap-6">
                      <button
                        onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                        className={`${styles.btnFunc} px-8 py-4 rounded-lg font-bold flex items-center gap-3 font-mono`}
                        style={{ background: "#BDC3C7", color: "#000" }}
                      >
                        github.auth() →
                      </button>
                      <button
                        className={`${styles.btnFunc} px-8 py-4 rounded-lg font-bold flex items-center gap-3`}
                        style={{ border: "1px solid rgba(189,195,199,0.4)", color: "#BDC3C7", background: "none", cursor: "pointer" }}
                      >
                        watchDemo(video_id)
                      </button>
                    </div>
                  </div>
                  {/* line 6 */}
                  <div className="flex items-start gap-4 mt-8">
                    <span style={{ color: "rgba(127, 140, 141, 0.3)", userSelect: "none", width: "32px", textAlign: "right" }}>06</span>
                    <div className="pl-8">
                      {");"}
                    </div>
                  </div>
                  {/* line 7 */}
                  <div className="flex items-start gap-4 mt-2">
                    <span style={{ color: "rgba(127, 140, 141, 0.3)", userSelect: "none", width: "32px", textAlign: "right" }}>07</span>
                    <div>
                      {"};"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee with Tech Tags */}
        <div style={{ borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", background: "rgba(10,10,10,0.5)", padding: "24px 0", overflow: "hidden", marginTop: "30px" }}>
          <div className={styles.marquee} style={{ whiteSpace: "nowrap", padding: "0 40px" }}>
            <span className="font-mono text-[12px] text-on-surface-variant flex items-center gap-2"><span
              className={styles.syntaxAttr}>import</span> {"{ NextJS }"} from 'web-stack'</span>
            <span className="font-mono text-[12px] text-on-surface-variant flex items-center gap-2"><span
              className={styles.syntaxAttr}>import</span> {"{ Monaco }"} from 'editors'</span>
            <span className="font-mono text-[12px] text-on-surface-variant flex items-center gap-2"><span
              className={styles.syntaxAttr}>import</span> {"{ CRDT }"} from 'sync-engines'</span>
            <span className="font-mono text-[12px] text-on-surface-variant flex items-center gap-2"><span
              className={styles.syntaxAttr}>import</span> {"{ Docker }"} from 'runtime'</span>
            <span className="font-mono text-[12px] text-on-surface-variant flex items-center gap-2"><span
              className={styles.syntaxAttr}>import</span> {"{Groq}"} from 'ai-accelerators'</span>
            <span className="font-mono text-[12px] text-on-surface-variant flex items-center gap-2"><span
              className={styles.syntaxAttr}>import</span> {"{ NextJS }"} from 'web-stack'</span>
            <span className="font-mono text-[12px] text-on-surface-variant flex items-center gap-2"><span
              className={styles.syntaxAttr}>import</span> {"{ Monaco }"} from 'editors'</span>
          </div>
        </div>

        {/* Features section */}
        <section className="py-32 px-10 md:px-40 relative">
          <div className="max-w-[1200px] mx-auto">
            <div className={`${styles.reveal} ${styles.revealActive}`} style={{ marginBottom: "60px" }}>
              <h2
                className={`${styles.syntaxKeyword} font-mono text-[14px] mb-4 uppercase font-bold`}
                style={{ letterSpacing: "0.2em" }}
              >
                // Engineered for Flow
              </h2>
              <h3 className="text-[40px] font-bold tracking-tight text-on-surface">
                Precision instruments for <br /> high-frequency shipping.
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1px", background: "rgba(26,26,26,0.4)", border: "1px solid rgba(26,26,26,0.4)" }}>
              {/* Feature 1 */}
              <div ref={addRevealRef} className={`${styles.reveal} ${styles.revealActive}`} style={{ background: "#050505", padding: "40px", transitionDelay: "100ms" }}>
                <div className="font-mono mb-6">
                  <span className="mr-4" style={{ color: "rgba(127, 140, 141, 0.3)" }}>01</span>
                  <span className={`${styles.syntaxAttr}`}>SyncEngine</span>.<span style={{ color: "#ECF0F1" }}>init</span>{"()"}
                </div>
                <h4 className="text-[20px] font-bold mb-4 text-on-surface">
                  Deterministic Sync
                </h4>
                <p className="leading-relaxed font-light" style={{ color: "#7F8C8D" }}>Advanced conflict resolution via
                  Yjs protocols. Zero latency shared state for 100+ concurrent editors.</p>
              </div>
              {/* Feature 2 */}
              <div ref={addRevealRef} className={`${styles.reveal} ${styles.revealActive}`} style={{ background: "#050505", padding: "40px", transitionDelay: "100ms" }}>
                <div className="font-mono mb-6">
                  <span className="mr-4" style={{ color: "rgba(127, 140, 141, 0.3)" }}>02</span>
                  <span className={`${styles.syntaxAttr}`}>AiAgent</span>.<span style={{ color: "#ECF0F1" }}>complete</span>{"()"}
                </div>
                <h4 className="text-[20px] font-bold mb-4 text-on-surface">
                  Groq Acceleration
                </h4>
                <p className="leading-relaxed font-light" style={{ color: "#7F8C8D" }}>Sub-100ms contextual completions
                  using Groq LPU™ technology. Instant logic generation at your fingertips.</p>
              </div>
              {/* Feature 3 */}
              <div ref={addRevealRef} className={`${styles.reveal} ${styles.revealActive}`} style={{ background: "#050505", padding: "40px", transitionDelay: "100ms" }}>
                <div className="font-mono mb-6">
                  <span className="mr-4" style={{ color: "rgba(127, 140, 141, 0.3)" }}>03</span>
                  <span className={`${styles.syntaxAttr}`}>Environment</span>.<span style={{ color: "#ECF0F1" }}>spawn</span>{"()"}
                </div>
                <h4 className="text-[20px] font-bold mb-4 text-on-surface">
                  Cloud Sandboxes
                </h4>
                <p className="leading-relaxed font-light" style={{ color: "#7F8C8D" }}>Spin up full-stack Docker
                  containers in seconds. Root terminal access with pre-configured toolchains.</p>
              </div>
              {/* Feature 4 */}
              <div ref={addRevealRef} className={`${styles.reveal} ${styles.revealActive}`} style={{ background: "#050505", padding: "40px", transitionDelay: "100ms" }}>
                <div className="font-mono mb-6">
                  <span className="mr-4" style={{ color: "rgba(127, 140, 141, 0.3)" }}>04</span>
                  <span className={`${styles.syntaxAttr}`}>Git</span>.<span style={{ color: "#ECF0F1" }}>rebase</span>{"()"}
                </div>
                <h4 className="text-[20px] font-bold mb-4 text-on-surface">
                  Deep Integration
                </h4>
                <p className="leading-relaxed font-light" style={{ color: "#7F8C8D" }}>Native branch management and
                  visual diffing. Direct integration with GitHub and GitLab workflows.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="py-40" style={{ background: "rgba(10,10,10,0.4)" }}>
          <div className="max-w-5xl mx-auto px-10 text-center">
            <div className={`${styles.reveal} ${styles.revealActive} px-4 py-1 mb-10 inline-block rounded`} style={{ border: "1px solid rgba(189, 195, 199, 0.3)", background: "rgba(189, 195, 199, 0.05)" }}>
              <span className="font-mono text-[12px]" style={{ color: "#BDC3C7" }}>{"system.check(): healthy_performance"}</span>
            </div>
            <h2 className="text-[48px] md:text-[64px] font-bold mb-16 tracking-tighter">
              Ship <span className={styles.syntaxFunc}>code</span>, <br />not  <span className={styles.syntaxAttr}>configuration</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 font-mono">
              <div className="p-8 border rounded-lg bg-black" style={{ borderColor: "rgba(26, 26, 26, 0.5)" }}>
                <div className="text-[36px] font-bold mb-2" style={{ color: "#BDC3C7" }}>50ms</div>
                <div className="text-[11px] uppercase tracking-widest" style={{ color: "#7F8C8D" }}>latency_max</div>
              </div>
              <div className="p-8 border rounded-lg bg-black" style={{ borderColor: "rgba(26, 26, 26, 0.5)" }}>
                <div className="text-[36px] font-bold mb-2" style={{ color: "#7F8C8D" }}>99.9%</div>
                <div className="text-[11px] uppercase tracking-widest" style={{ color: "#7F8C8D" }}>uptime_guarantee</div>
              </div>
              <div className="p-8 border rounded-lg bg-black" style={{ borderColor: "rgba(26, 26, 26, 0.5)" }}>
                <div className="text-[36px] font-bold mb-2" style={{ color: "#95A5A6" }}>0.0s</div>
                <div className="text-[11px] uppercase tracking-widest" style={{ color: "#7F8C8D" }}>setup_duration</div>
              </div>
            </div>
            <button className={`${styles.butnFunc} px-12 py-6 rounded-xl font-bold text-[18px] flex items-center gap-4 mx-auto shadow-2xl`} style={{ background: "#BDC3C7", color: "#000", boxShadow: "0 25px 50px rgba(189, 195, 199, 0.4)" }} onClick={() => signIn("github", { callbackUrl: "/dashboard" })}>
              develop_now()
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="24" height="24" fill="currentColor">
                <path d="M392.8 65.2C375.8 60.3 358.1 70.2 353.2 87.2L225.2 535.2C220.3 552.2 230.2 569.9 247.2 574.8C264.2 579.7 281.9 569.8 286.8 552.8L414.8 104.8C419.7 87.8 409.8 70.1 392.8 65.2zM457.4 201.3C444.9 213.8 444.9 234.1 457.4 246.6L530.8 320L457.4 393.4C444.9 405.9 444.9 426.2 457.4 438.7C469.9 451.2 490.2 451.2 502.7 438.7L598.7 342.7C611.2 330.2 611.2 309.9 598.7 297.4L502.7 201.4C490.2 188.9 469.9 188.9 457.4 201.4zM182.7 201.3C170.2 188.8 149.9 188.8 137.4 201.3L41.4 297.3C28.9 309.8 28.9 330.1 41.4 342.6L137.4 438.6C149.9 451.1 170.2 451.1 182.7 438.6C195.2 426.1 195.2 405.8 182.7 393.3L109.3 320L182.6 246.6C195.1 234.1 195.1 213.8 182.6 201.3z" />
              </svg>
            </button>
          </div>
        </section>
      </main>
      <footer className={`border-t py-20 relative z-10 `} style={{ background: "#050505", borderColor: "#1a1a1a" }}>
        <div className="max-w-[1440px] mx-auto px-10 md:px-20 grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5">
            <span className="font-mono font-bold text-[20px] mb-6 block" style={{ color: "#BDC3C7" }}>collab_ide</span>
            <p className="leading-relaxed font-light mb-8 max-w-sm" style={{ color: "rgba(127, 140, 141, 0.7)" }}>
              {`/* Building the future of developer experience. High-frequency tools for distributed engineering
                    squads. */`}
            </p>
            <div className="flex gap-4">
              <div className={`${styles.socialIcon} w-10 h-10 border flex items-center justify-center rounded  transition-all cursor-pointer `} style={{ borderColor: "#1a1a1a" }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  shapeRendering="geometricPrecision"
                  textRendering="geometricPrecision"
                  imageRendering="optimizeQuality"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  viewBox="0 0 512 499.368"
                  width="20"
                  height="20"
                >
                  <path
                    fill="#fff"
                    fillRule="nonzero"
                    d="M256.003 0C114.555 0 0 114.555 0 256.003c0 113.286 73.28 208.961 175.038 242.865 12.796 2.247 17.586-5.433 17.586-12.153 0-6.077-.309-26.225-.309-47.686-64.313 11.844-80.941-15.674-86.058-30.055-2.896-7.37-15.359-30.1-26.269-36.177-8.948-4.808-21.752-16.652-.31-16.961 20.168-.309 34.574 18.564 39.382 26.244 23.038 38.732 59.839 27.828 74.555 21.101 2.227-16.627 8.947-27.828 16.318-34.239-56.968-6.386-116.467-28.471-116.467-126.399 0-27.827 9.907-50.866 26.225-68.787-2.562-6.41-11.51-32.655 2.562-67.853 0 0 21.436-6.72 70.409 26.244 20.483-5.767 42.227-8.638 63.998-8.638 21.751 0 43.52 2.896 63.997 8.638 48.973-33.279 70.39-26.244 70.39-26.244 14.09 35.192 5.117 61.443 2.562 67.853 16.318 17.921 26.244 40.625 26.244 68.787 0 98.237-59.84 119.988-116.801 126.399 9.282 8.014 17.277 23.373 17.277 47.371 0 34.238-.309 61.751-.309 70.389 0 6.721 4.808 14.735 17.586 12.179C438.739 464.964 512 368.955 512 256.003 512 114.555 397.445 0 256.003 0z"
                  />
                </svg>
              </div>
              <div className={`${styles.socialIcon} w-10 h-10 border flex items-center justify-center rounded  transition-all cursor-pointer `} style={{ borderColor: "#1a1a1a" }}>
                <svg
                  width="24px"
                  height="24px"
                  viewBox="0 0 24 24"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <title>{"LinkedIn icon"}</title>
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
            </div>
          </div>
          {/* Footer Links */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-12 font-mono text-[13px]">
            <div className="flex flex-col gap-5">
              <span className="font-bold uppercase tracking-widest text-[11px]" style={{ color: "#ECF0F1" }}>Product</span>
              <a className="transition-colors" style={{ color: "#7F8C8D" }} href="#">documentation</a>
              <a className="transition-colors" style={{ color: "#7F8C8D" }} href="#">changelog</a>
              <a className="transition-colors" style={{ color: "#7F8C8D" }} href="#">pricing</a>
            </div>
            <div className="flex flex-col gap-5">
              <span className="font-bold uppercase tracking-widest text-[11px]" style={{ color: "#ECF0F1" }}>Resources</span>
              <a className="transition-colors" style={{ color: "#7F8C8D" }} href="#">api_reference</a>
              <a className="transition-colors" style={{ color: "#7F8C8D" }} href="#">status</a>
              <a className="transition-colors" style={{ color: "#7F8C8D" }} href="#">github_repo</a>
            </div>
            <div className="flex flex-col gap-5">
              <span className="font-bold uppercase tracking-widest text-[11px]" style={{ color: "#ECF0F1" }}>Legal</span>
              <a className="transition-colors" style={{ color: "#7F8C8D" }} href="#">privacy_policy</a>
              <a className="transition-colors" style={{ color: "#7F8C8D" }} href="#">terms_of_service</a>
            </div>
          </div>
        </div>
        {/* Footer Bottom */}
        <div className="max-w-[1440px] mx-auto px-10 md:px-20 mt-20 pt-10 flex flex-col sm:flex-row justify-between items-center gap-6 font-mono text-[11px]" style={{ borderTop: "1px solid #1a1a1a", color: "rgba(127, 140, 141, 0.4)" }}>
          <span>{"// © 2026 Collab IDE. compiled: successful."}</span>
          <span>TECHNICAL_SILVER_SYNTAX_V2.0</span>
        </div>
      </footer>
    </div>
  )

}
