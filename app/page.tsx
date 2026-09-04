"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import * as THREE from "three";
import { Html, Sparkles, Grid } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import { ShaderGradient, ShaderGradientCanvas } from "shadergradient";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import {
  SiNextdotjs, SiTypescript, SiThreedotjs, SiDocker,
  SiSupabase, SiPrisma, SiGreensock, SiWebrtc, SiReact
} from "react-icons/si";
import { IconType } from "react-icons";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ============================================================
// RESPONSIVE HOOK
// ============================================================

function useIsMobile(breakpoint = 768) {
  // Lazy-init from window when available, so the very first client render
  // already knows it's mobile instead of assuming desktop for one tick —
  // avoids a brief flash where mobile-only logic (like skipping the footer's
  // scroll-fade below) hasn't kicked in yet.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}


function HeroTypewriter() {
  const full = "A full-stack IDE that runs in the browser — real-time multiplayer editing, a sandboxed terminal, AI completions, and git, all in one tab.";
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    let i = 0;
    const tick = () => {
      i++;
      setTyped(i);
      if (i < full.length) {
        const r = Math.random();
        const delay = r < 0.05 ? 120 + Math.random() * 80 : 28 + Math.random() * 22;
        setTimeout(tick, delay);
      }
    };
    setTimeout(tick, 400);
  }, []);

  return (
    <p className="hero-sub" style={{ minHeight: "4rem" }}>
      {full.slice(0, typed)}
      {typed < full.length && (
        <span style={{
          display: "inline-block",
          width: 2, height: "1em",
          background: "#F5A623",
          marginLeft: 2,
          verticalAlign: "middle",
          animation: "cursorBlink 0.8s steps(2) infinite",
        }} />
      )}
    </p>
  );
}


// ============================================================
// HERO SECTION
// ============================================================

function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorTagRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const fadeOverlayRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;


  useGSAP(() => {
    // eyebrow — char by char
    const eyebrow = document.querySelector(".hero-eyebrow");
    if (eyebrow) {
      const text = eyebrow.textContent || "";
      eyebrow.textContent = "";
      text.split("").forEach((char, i) => {
        const span = document.createElement("span");
        span.textContent = char === " " ? "\u00A0" : char;
        span.style.display = "inline-block";
        span.style.opacity = "0";
        eyebrow.appendChild(span);
        gsap.fromTo(span,
          { opacity: 0, x: -12, filter: "blur(8px)" },
          { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.5, delay: 0.1 + i * 0.03, ease: "power3.out" }
        );
      });
    }

    // h1 — char by char
    const h1 = document.querySelector(".hero-h1");
    if (h1) {
      const nodes = Array.from(h1.childNodes);
      h1.innerHTML = "";
      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const chars = (node.textContent || "").split("");
          chars.forEach((char, i) => {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            span.style.display = "inline-block";
            span.style.opacity = "0";
            h1.appendChild(span);
            gsap.fromTo(span,
              { opacity: 0, x: -16, filter: "blur(12px)" },
              { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.6, delay: 0.3 + i * 0.025, ease: "power3.out" }
            );
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const chars = (el.textContent || "").split("");
          chars.forEach((char, i) => {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            span.style.display = "inline-block";
            span.style.opacity = "0";
            span.style.color = el.style.color || "";
            span.className = el.className || "";
            h1.appendChild(span);
            gsap.fromTo(span,
              { opacity: 0, x: -16, filter: "blur(12px)" },
              { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.6, delay: 0.3 + i * 0.025, ease: "power3.out" }
            );
          });
          // preserve line break
          if (el.tagName === "BR") h1.appendChild(document.createElement("br"));
        }
      });
    }

    gsap.from(".hero-ctas", { opacity: 0, y: 20, duration: 0.8, delay: 1.2 });
    gsap.from(".hero-meta", { opacity: 0, duration: 0.8, delay: 1.4 });
  }, []);

  useEffect(() => {
    const nav = document.querySelector(".hero-nav");
    if (!nav) return;

    const onScroll = () => {
      if (window.scrollY > 80) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const dot = cursorDotRef.current;
    const tag = cursorTagRef.current;
    if (!dot || !tag) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    let mx = 0, my = 0, dx = 0, dy = 0;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
    };
    window.addEventListener("mousemove", onMove);

    const loop = () => {
      dx += (mx - dx) * 0.18; dy += (my - dy) * 0.18;
      tag.style.left = dx + "px"; tag.style.top = dy - 46 + "px";
      raf = requestAnimationFrame(loop);
    };
    loop();

    const targets = document.querySelectorAll("[data-cursor]");
    const handlers: { el: Element; enter: () => void; leave: () => void }[] = [];
    targets.forEach((el) => {
      const enter = () => {
        tag.textContent = el.getAttribute("data-cursor");
        tag.classList.add("show");
        dot.style.width = "0px"; dot.style.height = "0px";
      };
      const leave = () => {
        tag.classList.remove("show");
        dot.style.width = "10px"; dot.style.height = "10px";
      };
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      handlers.push({ el, enter, leave });
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      handlers.forEach(({ el, enter, leave }) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const heroEl = heroRef.current;
    if (!canvas || !heroEl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W: number, H: number;
    const dpr = window.devicePixelRatio || 1;
    const mouse = { x: -9999, y: -9999 };
    const GLYPHS = "01{}[]<>/;()=+*$#&%01アｺﾆﾄ01010101".split("");

    let particles: {
      x: number; y: number; baseX: number; baseY: number;
      ch: string; phase: number; speed: number;
    }[] = [];

    function resize() {
      W = canvas!.width = canvas!.offsetWidth * dpr;
      H = canvas!.height = canvas!.offsetHeight * dpr;
    }
    function initParticles() {
      particles = [];
      const cell = 34 * dpr;
      const cols = Math.ceil(W / cell);
      const rows = Math.ceil(H / cell);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          particles.push({
            x: i * cell + cell / 2, y: j * cell + cell / 2,
            baseX: i * cell + cell / 2, baseY: j * cell + cell / 2,
            ch: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            phase: Math.random() * Math.PI * 2,
            speed: 0.6 + Math.random() * 0.8,
          });
        }
      }
    }
    resize(); initParticles();

    const onResize = () => { resize(); initParticles(); };
    window.addEventListener("resize", onResize);

    const onMouseMove = (e: MouseEvent) => {
      const r = heroEl.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr;
      mouse.y = (e.clientY - r.top) * dpr;
    };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    heroEl.addEventListener("mousemove", onMouseMove);
    heroEl.addEventListener("mouseleave", onMouseLeave);

    let t = 0, raf: number;
    function animate() {
      t += 0.016;
      ctx!.clearRect(0, 0, W, H);
      ctx!.font = `${11 * dpr}px 'JetBrains Mono', monospace`;
      ctx!.textAlign = "center"; ctx!.textBaseline = "middle";
      for (const p of particles) {
        const wave =
          Math.sin(t * p.speed + p.baseX * 0.01) * 6 * dpr +
          Math.cos(t * p.speed * 0.7 + p.baseY * 0.012) * 4 * dpr;
        const ddx = p.baseX - mouse.x, ddy = p.baseY - mouse.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        const radius = 220 * dpr;
        let push = 0, opacityBoost = 0;
        if (dist < radius) {
          const force = 1 - dist / radius;
          push = force * 26 * dpr; opacityBoost = force;
        }
        const angle = Math.atan2(ddy, ddx);
        p.x = p.baseX + Math.cos(angle) * push;
        p.y = p.baseY + wave + Math.sin(angle) * push * 0.3;
        const baseAlpha = 0.1 + Math.sin(t * p.speed + p.baseX * 0.02) * 0.04;
        const alpha = Math.min(0.85, baseAlpha + opacityBoost * 0.6);
        const isAmber = opacityBoost > 0.35;
        ctx!.fillStyle = isAmber ? `rgba(245,166,35,${alpha})` : `rgba(189,195,199,${alpha * 0.7})`;
        ctx!.fillText(p.ch, p.x, p.y);
      }
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      heroEl.removeEventListener("mousemove", onMouseMove);
      heroEl.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <style>{`
        .hero-wrap * { box-sizing: border-box;}
        .hero-wrap { font-family: var(--font-geist-pixel-circle); color: #f5f5f4; width:100%; height:100%; }
        .hero-wrap p { font-family: var(--font-geist-sans); font-weight:400; }
        .hero-wrap h1 { font-family: var(--font-geist-pixel-circle); font-weight:500; }
        #cursor-dot {
          position: fixed; top:0; left:0; width:12px; height:12px; border-radius:50%;
          background:#F5A623; pointer-events:none; z-index:9999;
          transform: translate(-50%,-50%); mix-blend-mode: difference;
          transition: width .2s, height .2s;
        }
        #cursor-tag {
          position: fixed; top:0; left:0; z-index:9998; pointer-events:none;
          font-family:'JetBrains Mono', monospace; font-size:.72rem; font-weight:600;
          background:#F5A623; color:#1a1206; padding:6px 12px; border-radius:20px;
          white-space:nowrap; opacity:0; transform: translate(-50%,-50%) scale(.7);
          transition: opacity .22s ease, transform .22s ease;
        }
        #cursor-tag.show { opacity:1; transform: translate(-50%,-50%) scale(1); }
        @media (hover:none), (pointer:coarse) { #cursor-dot, #cursor-tag { display:none; } }
        .hero-section {
          position: relative; min-height: 100vh; width:100%; background: #050505;
          display:flex; flex-direction:column; justify-content:center;
          padding-top: 90px; overflow: hidden;
        }
        #wave-canvas {
          position:absolute; inset:0; width:100%; height:100%; z-index:0;
          mask-image: linear-gradient(to bottom, black 55%, transparent 96%);
        }
        .hero-nav {
          position:fixed; top:0; left:50%; transform:translateX(-50%);
          width:100%; z-index:100;
          display:flex; align-items:center; justify-content:space-between;
          padding:16px 32px;
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          background: rgba(5,5,5,0.8);
          border: 1px solid transparent;
          border-radius: 0px;
          transition: width 0.6s cubic-bezier(0.16,1,0.3,1),
              border-radius 0.6s cubic-bezier(0.16,1,0.3,1),
              top 0.6s cubic-bezier(0.16,1,0.3,1),
              padding 0.6s cubic-bezier(0.16,1,0.3,1),
              border-color 0.6s ease,
              opacity 0.4s ease;
        }
        .hero-nav.scrolled {
          top:16px;
          width:60%;
          border-radius: 16px;
          border-color: rgba(255,255,255,0.06);
          background: rgba(5,5,5,0.6);
          padding:14px 28px;
        }
        .hero-logo { font-family:'JetBrains Mono', monospace; font-weight:700; font-size:1.02rem; color:#fff; display:flex; gap:.5rem; }
        .hero-logo .dot { color:#F5A623; }
        .hero-navlinks { display:flex; gap:2.4rem; font-family:'JetBrains Mono', monospace; font-size:.84rem; color:#7d8488; }
        .hero-navlinks a { color:#7d8488; text-decoration:none; transition: color 0.2s ease;       cursor:pointer; }
        .hero-navlinks a:hover { color:#F5A623; }
        .hero-nav-cta {
          font-family:'JetBrains Mono', monospace; font-size:.82rem; font-weight:600;
          background:#F5A623; color:#1a1206; padding:9px 18px; border-radius:7px; border:1px solid #F5A623;
        }
        .hero-inner { position:relative; z-index:2; width:100%; margin:0 auto; padding:0 32px; }
        .hero-eyebrow {
          font-family:'JetBrains Mono', monospace; font-size:.78rem; letter-spacing:.04em; color:#F5A623;
          display:flex; align-items:center; margin-bottom:1.1rem; text-transform:lowercase;
        }
        .hero-eyebrow::before { content:''; width:7px; height:7px; border-radius:50%; background:#F5A623; margin-right:8px; box-shadow:0 0 10px #F5A623; }
        .hero-h1 { font-weight:800; font-size:clamp(2.6rem, 6.4vw, 5.4rem); line-height:1.03; letter-spacing:-.02em; max-width:880px; }
        .hero-h1 .accent { color:#F5A623; }
        .hero-sub { margin-top:1.7rem; font-size:1.12rem; color:#7d8488; max-width:560px; line-height:1.65; }
        .hero-ctas { display:flex; gap:1rem; margin-top:2.6rem; flex-wrap:wrap; }
        .hero-btn-primary {
          font-family:'JetBrains Mono', monospace; font-size:.9rem; font-weight:600;
          background:#F5A623; color:#1a1206; padding:14px 26px; border-radius:8px; border:1px solid #F5A623;
          display:flex; align-items:center; gap:.6rem;
        }
        .hero-btn-secondary {
          font-family:'JetBrains Mono', monospace; font-size:.9rem; font-weight:500;
          background:transparent; color:#BDC3C7; padding:14px 26px; border-radius:8px; border:1px solid #1a1a1a;
          display:flex; align-items:center; gap:.6rem;
        }
        .hero-scroll-cue { position:absolute; bottom:28px; left:32px; z-index:2; font-family:'JetBrains Mono', monospace; font-size:.72rem; color:#7d8488; display:flex; align-items:center; gap:.6rem; }
        .hero-scroll-cue .line { width:1px; height:34px; background:#1a1a1a; position:relative; overflow:hidden; }
        .hero-scroll-cue .line::after {
          content:''; position:absolute; top:0; left:0; width:100%; height:40%; background:#F5A623;
          animation: scrolldown 1.8s ease-in-out infinite;
        }
        @keyframes scrolldown { 0%{transform:translateY(-100%);} 100%{transform:translateY(250%);} }

        /* ---- Mobile responsiveness ---- */
        @media (max-width: 768px) {
          .hero-nav { padding: 10px 16px; }
          .hero-nav.scrolled { width: 92%; padding: 10px 16px; }
          .hero-navlinks { display: none; }
          .hero-logo { font-size: 0.9rem; }
          .hero-nav-cta { font-size: 0.72rem; padding: 8px 13px; }

          .hero-section { padding-top: 76px; min-height: 92vh; }
          .hero-inner { padding: 0 20px; }

          .hero-eyebrow { font-size: 0.66rem; margin-bottom: 0.8rem; }
          .hero-eyebrow::before { width: 6px; height: 6px; }

          .hero-h1 {
            font-size: clamp(2rem, 9.5vw, 2.6rem) !important;
            line-height: 1.12 !important;
            letter-spacing: -0.01em !important;
            max-width: 100% !important;
          }

          .hero-sub { font-size: 0.88rem; line-height: 1.6; margin-top: 1.1rem; max-width: 100%; }

          .hero-ctas {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            gap: 0.7rem;
            margin-top: 1.8rem;
          }
          .hero-btn-primary, .hero-btn-secondary {
            width: 100%;
            justify-content: center;
            padding: 13px 20px;
            font-size: 0.82rem;
          }

          .hero-scroll-cue { display: none; }
        }

        @media (max-width: 380px) {
          .hero-h1 { font-size: clamp(1.7rem, 10vw, 2.1rem) !important; }
          .hero-logo { font-size: 0.82rem; }
          .hero-nav-cta { font-size: 0.66rem; padding: 7px 11px; }
        }
      `}</style>
      <div className="hero-wrap" id="hero-wrapper" ref={heroRef}>
        <div id="cursor-dot" ref={cursorDotRef}></div>
        <div id="cursor-tag" ref={cursorTagRef}></div>
        <div className="hero-nav">
          <div className="hero-logo">collab<span className="dot">_</span>ide</div>
          <div className="hero-navlinks">
            <a href="#workspace-wrapper" onClick={(e) => {
              e.preventDefault();
              document.querySelector("#workspace-wrapper")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}>features</a>
            <a href="#stack-section" onClick={(e) => {
              e.preventDefault();
              document.querySelector("#stack-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}>stack</a>
            <a href="#footer-wrapper" onClick={(e) => {
              e.preventDefault();
              document.querySelector("#footer-wrapper")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}>workspace</a>
          </div>
          <a className="hero-nav-cta" data-cursor="launch →"
            href={isLoggedIn ? "/dashboard" : "/api/auth/signin"}>
            {isLoggedIn ? "open_in_ide()" : "login()"}
          </a>
        </div>
        <section className="hero-section">
          <canvas id="wave-canvas" ref={canvasRef}></canvas>
          <div className="hero-inner">
            <div className="hero-eyebrow">project.init() — collaborative cloud ide</div>
            <h1 className="hero-h1">
              Code together,<br /><span className="accent">ship</span> from the cloud
            </h1>
            <HeroTypewriter />
            <div className="hero-ctas">
              <a className="hero-btn-primary" data-cursor="open()"
                href={isLoggedIn ? "/dashboard" : "/api/auth/signin"}>
                {isLoggedIn ? "launch_ide() →" : "launch_ide() →"}
              </a>
              <a className="hero-btn-secondary" data-cursor="github ↗"
                href="https://github.com/Kaivalyakulkarni/collab-Ide"
                target="_blank" rel="noreferrer">
                view on github
              </a>
            </div>
          </div>
          <div className="hero-scroll-cue"><div className="line"></div>scroll</div>
        </section>
        <div ref={fadeOverlayRef} style={{ position: "fixed", inset: 0, background: "#050505", opacity: 0, pointerEvents: "none", zIndex: 50 }} />
      </div>
    </>
  );
}


// ============================================================
// MARQUEE — tech stack scrolling strip
// ============================================================

const STACK_ITEMS: { label: string; color: string; Icon?: IconType }[] = [
  { label: "Next.js", color: "#BDC3C7", Icon: SiNextdotjs },
  { label: "TypeScript", color: "#BDC3C7", Icon: SiTypescript },
  { label: "React", color: "#BDC3C7", Icon: SiReact },
  { label: "Three.js", color: "#BDC3C7", Icon: SiThreedotjs },
  { label: "Yjs CRDTs", color: "#BDC3C7" },   // no Icon — glowing dot
  { label: "Docker", color: "#BDC3C7", Icon: SiDocker },
  { label: "Supabase", color: "#BDC3C7", Icon: SiSupabase },
  { label: "Prisma", color: "#BDC3C7", Icon: SiPrisma },
  { label: "GSAP", color: "#BDC3C7", Icon: SiGreensock },
  { label: "Monaco Editor", color: "#BDC3C7" },  // also no icon — same treatment
];

const DOUBLED = [...STACK_ITEMS, ...STACK_ITEMS];

function Marquee({ isReversed = false }: { isReversed?: boolean }) {
  const movingRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const scaleTweenRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(() => {
    gsap.set(movingRef.current, { xPercent: isReversed ? -50 : 0 });
    tlRef.current = gsap.timeline({ defaults: { ease: "none", repeat: -1 } })
      .to(movingRef.current, { xPercent: isReversed ? 0 : -50, duration: 25 })
      .set(movingRef.current, { xPercent: isReversed ? -50 : 0 });
  }, { dependencies: [isReversed] });

  const onEnter = () => {
    scaleTweenRef.current?.kill();
    scaleTweenRef.current = gsap.to(tlRef.current!, { timeScale: 0.2, duration: 0.4 });
  };
  const onLeave = () => {
    scaleTweenRef.current?.kill();
    scaleTweenRef.current = gsap.to(tlRef.current!, { timeScale: 1, duration: 0.3 });
  };

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        overflow: "hidden",
        width: "100%",
        maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      <div ref={movingRef} style={{ display: "flex", width: "fit-content" }}>
        {DOUBLED.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "0 32px", flexShrink: 0,
          }}>
            {item.Icon ? (
              <item.Icon style={{ color: item.color, fontSize: 18, opacity: 0.9 }} />
            ) : (
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#BDC3C7",
                boxShadow: "0 0 8px #F59E0B",
                flexShrink: 0,
              }} />
            )}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, fontWeight: 600,
              color: item.color, whiteSpace: "nowrap", opacity: 0.85,
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PANEL: FAKE IDE EDITOR (Section 1)
// ============================================================

function FakeEditor() {
  const allCode = [
    "// Real-time multiplayer editing",
    "const session = await collab.join(roomId);",
    "session.onCursorMove((user, pos) => {",
    "  renderCursor(user.color, pos);",
    "});",
    "session.onEdit((delta) => {",
    "  applyDelta(editor, delta);",
    "});",
  ];

  const users = [
    { name: "Kaivalya", color: "#F59E0B", lines: [0, 4] },
    { name: "Sarah", color: "#A855F7", lines: [1, 5] },
    { name: "Ishu", color: "#22C55E", lines: [2, 6] },
    { name: "Rohan", color: "#3B82F6", lines: [3, 7] },
  ];

  const [lineTexts, setLineTexts] = useState<string[]>(Array(8).fill(""));
  const [activeLine, setActiveLine] = useState<number[]>([0, 1, 2, 3]); // global line index each user is on

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    users.forEach((user, ui) => {
      let lineIdxInUser = 0;
      let charIdx = 0;

      const typeNext = () => {
        const globalLine = user.lines[lineIdxInUser];
        const fullText = allCode[globalLine];

        if (charIdx <= fullText.length) {
          const captured = charIdx;
          setLineTexts(prev => {
            const next = [...prev];
            next[globalLine] = fullText.slice(0, captured);
            return next;
          });
          setActiveLine(prev => {
            const next = [...prev];
            next[ui] = globalLine;
            return next;
          });
          charIdx++;

          // random typing rhythm
          const r = Math.random();
          const delay =
            r < 0.04 ? 1200 + Math.random() * 1000  // long thinking pause
              : r < 0.12 ? 300 + Math.random() * 400  // short pause
                : 80 + Math.random() * 120;             // normal typing — was 28-55, now 80-200

          timeouts.push(setTimeout(typeNext, delay));
        } else {
          // finished line — move to next after pause, clear old line on loop
          const prevGlobalLine = globalLine;
          lineIdxInUser = lineIdxInUser + 1;
          if (lineIdxInUser >= user.lines.length) return;
          charIdx = 0;
          const nextGlobalLine = user.lines[lineIdxInUser];

          timeouts.push(setTimeout(() => {
            // clear next line before retyping (loop reset)
            setLineTexts(prev => {
              const next = [...prev];
              next[nextGlobalLine] = "";
              return next;
            });
            typeNext();
          }, 300 + Math.random() * 500));
        }
      };

      // stagger each user's start
      timeouts.push(setTimeout(typeNext, ui * 400 + Math.random() * 300));
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      width: "680px", background: "#0d0d0d", border: "1px solid #1a1a1a",
      borderRadius: "10px", overflow: "hidden",
      fontFamily: "'JetBrains Mono', monospace",
      boxShadow: "0 0 80px rgba(245,158,11,0.15), 0 30px 60px rgba(0,0,0,0.7)",
    }}>
      {/* title bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid #1a1a1a", background: "#111" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ marginLeft: 12, fontSize: 11, color: "#7F8C8D" }}>collab-ide · filename.ts</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          {users.map((u, i) => (
            <div key={u.name} style={{
              width: 20, height: 20, borderRadius: "50%", background: u.color,
              color: "#fff", fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #0d0d0d", marginLeft: i === 0 ? 0 : -6,
              boxShadow: `0 0 8px ${u.color}88`,
            }}>{u.name[0]}</div>
          ))}
          <span style={{ fontSize: 10, color: "#22C55E", marginLeft: 8 }}>● 4 online</span>
        </div>
      </div>

      {/* code area */}
      <div style={{ padding: "16px 0", minHeight: 220 }}>
        {allCode.map((_, lineIdx) => {
          const activeUserIdx = users.findIndex((u, ui) => activeLine[ui] === lineIdx);
          const activeUser = activeUserIdx !== -1 ? users[activeUserIdx] : null;
          const displayText = lineTexts[lineIdx];

          return (
            <div key={lineIdx} style={{ display: "flex", padding: "3px 16px", minHeight: 20 }}>
              <span style={{ width: 24, color: "rgba(127,140,141,0.3)", fontSize: 11, userSelect: "none", flexShrink: 0 }}>
                {lineIdx + 1}
              </span>
              <span style={{ fontSize: 12, color: "#ECF0F1", whiteSpace: "pre" }}>
                {displayText}
                {activeUser && (
                  <span style={{ position: "relative", display: "inline-block" }}>
                    {/* label follows cursor */}
                    <span style={{
                      position: "absolute",
                      bottom: "100%",
                      left: 0,
                      background: activeUser.color,
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 3,
                      whiteSpace: "nowrap",
                      marginBottom: 2,
                      pointerEvents: "none",
                    }}>{activeUser.name}</span>
                    {/* blinking cursor bar */}
                    <span style={{
                      display: "inline-block",
                      width: 2,
                      height: 13,
                      background: activeUser.color,
                      verticalAlign: "middle",
                      animation: `blink${activeUserIdx} 0.8s steps(2) infinite`,
                    }} />
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* terminal strip */}
      <div style={{ borderTop: "1px solid #1a1a1a", background: "#000", padding: "10px 16px", fontSize: 11, color: "#7F8C8D" }}>
        <span style={{ color: "#5fbf77" }}>/tmp/workspace #</span> _
      </div>

      <style>{`
                @keyframes blink0 { 0%,50%{opacity:1} 51%,100%{opacity:0} }
                @keyframes blink1 { 0%,50%{opacity:1} 51%,100%{opacity:0} }
                @keyframes blink2 { 0%,50%{opacity:1} 51%,100%{opacity:0} }
                @keyframes blink3 { 0%,50%{opacity:1} 51%,100%{opacity:0} }
            `}</style>
    </div>
  );
}

// ============================================================
// PANEL: FAKE DASHBOARD (Section 2)
// ============================================================

function FakeDashboard() {
  return (

    <div style={{
      width: "820px", background: "#0d0d0d", border: "1px solid #1a1a1a",
      borderRadius: "10px", overflow: "hidden", fontFamily: "'JetBrains Mono', monospace",
      boxShadow: "0 0 80px rgba(245,158,11,0.12), 0 30px 60px rgba(0,0,0,0.7)",
    }}>
      <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a" }}>
        {/* sidebar */}
        <div style={{ width: 160, borderRight: "1px solid #1a1a1a", padding: "16px 12px", fontSize: 11, color: "#7F8C8D" }}>
          <div style={{ color: "#F59E0B", fontWeight: 700, marginBottom: 16, fontSize: 12 }}>collab_ide</div>
          <div style={{ color: "#ECF0F1", marginBottom: 8 }}>overview</div>
          <div style={{ marginBottom: 8 }}>projects <span style={{ float: "right", background: "#1a1a1a", padding: "1px 6px", borderRadius: 4 }}>3</span></div>
          <div style={{ marginBottom: 24 }}>settings</div>
          <div style={{ fontSize: 10, color: "#3a3a3a", marginBottom: 6 }}>RECENT</div>
          <div style={{ marginBottom: 6, color: "#BDC3C7" }}>EcoSphere</div>
          <div style={{ marginBottom: 6 }}>Folder_check</div>
        </div>
        {/* main */}
        <div style={{ flex: 1, padding: "16px 20px" }}>
          <div style={{ fontSize: 10, color: "#7F8C8D", marginBottom: 4 }}>// dashboard.init()</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ECF0F1", marginBottom: 16 }}>hello, kaivalya_dev()</div>
          {/* stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { label: "ACTIVE_PROJECTS", value: "2" },
              { label: "COLLABORATORS", value: "4" },
              { label: "TOTAL_FILES", value: "12" },
              { label: "AI_COMPLETIONS", value: "∞" },
            ].map(s => (
              <div key={s.label} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "#F59E0B", marginBottom: 4 }}>● {s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#ECF0F1" }}>{s.value}</div>
              </div>
            ))}
          </div>
          {/* projects */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              { name: "EcoSphere", status: "archived", lang: "Typescript" },
              { name: "Folder_check", status: "active", lang: "Typescript" },
              { name: "ishika2027", status: "active", lang: "Typescript" },
            ].map(p => (
              <div key={p.name} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: p.status === "active" ? "#22C55E" : "#7F8C8D", marginBottom: 6 }}>● {p.status}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#ECF0F1", marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "#7F8C8D" }}>{p.lang}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

  );
}

// ============================================================
// PANEL: FAKE Terminal (Section 3)
// ============================================================

function FakeTerminal() {
  const lines = [
    { text: "/tmp/workspace # docker run node:18-alpine", color: "#5fbf77", delay: 0 },
    { text: "Unable to find image 'node:18-alpine' locally", color: "#7F8C8D", delay: 800 },
    { text: "18-alpine: Pulling from library/node", color: "#7F8C8D", delay: 1400 },
    { text: "✓ Pull complete", color: "#22C55E", delay: 2200 },
    { text: "/tmp/workspace # node filename.ts", color: "#5fbf77", delay: 3000 },
    { text: "Sum: 30", color: "#ECF0F1", delay: 3800 },
    { text: "Result: 30", color: "#ECF0F1", delay: 4200 },
    { text: "/tmp/workspace # _", color: "#5fbf77", delay: 5000 },
  ];

  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    setVisibleLines(0);
    const timeouts = lines.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), lines[i].delay)
    );
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      width: "680px", background: "#000",
      border: "1px solid #1a1a1a", borderRadius: "10px",
      overflow: "hidden", fontFamily: "'JetBrains Mono', monospace",
      boxShadow: "0 0 80px rgba(34,197,94,0.1), 0 30px 60px rgba(0,0,0,0.7)",
    }}>
      {/* title bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid #1a1a1a", background: "#0a0a0a" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ marginLeft: 12, fontSize: 11, color: "#7F8C8D" }}>terminal — /tmp/workspace</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#22C55E", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 6px #22C55E" }} />
          docker · node:18-alpine
        </span>
      </div>

      {/* terminal output */}
      <div style={{ padding: "16px", minHeight: 260 }}>
        {lines.slice(0, visibleLines).map((line, i) => (
          <div key={i} style={{
            fontSize: 12, color: line.color,
            lineHeight: 1.8, whiteSpace: "pre",
          }}>
            {line.text}
            {/* blinking cursor on last visible line */}
            {i === visibleLines - 1 && i === lines.length - 1 && (
              <span style={{
                display: "inline-block", width: 8, height: 13,
                background: "#5fbf77", marginLeft: 2,
                verticalAlign: "middle",
                animation: "cursorBlink 0.8s steps(2) infinite",
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PANEL: CTA (Section 4)
// ============================================================

function FakeCTA({ isLoggedIn }: { isLoggedIn: boolean }) {


  return (
    <div style={{
      width: "580px", textAlign: "center", fontFamily: "'JetBrains Mono', monospace",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
    }}>
      <div style={{ fontSize: 11, color: "#F59E0B" }}>// workspace.ready()</div>
      <div style={{ fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 800, color: "#ECF0F1", lineHeight: 1.1 }}>
        Ready to ship<br /><span style={{ color: "#F59E0B" }}>from the cloud?</span>
      </div>
      <div style={{ fontSize: 13, color: "#7F8C8D", maxWidth: 400, lineHeight: 1.7 }}>
        No setup. No local installs. Just open a tab and start collaborating.
      </div>
      <a href={isLoggedIn ? "/dashboard" : "/api/auth/signin"} target="_blank" rel="noreferrer" style={{
        background: "#F59E0B", color: "#1a1206", fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700, fontSize: 14, padding: "14px 32px", borderRadius: 8,
        border: "none", cursor: "pointer", textDecoration: "none",
        boxShadow: "0 0 40px rgba(245,158,11,0.4)",
      }}>
        launch_ide() →
      </a>
      <div style={{ fontSize: 10, color: "#3a3a3a" }}>
        collab-ide-nine.vercel.app
      </div>
    </div>
  );
}

// ============================================================
// WORKSPACE SCENE — switches panel based on activeSection
// ============================================================

function WorkspaceScene({ activeSection, isLoggedIn }: { activeSection: number; isLoggedIn: boolean }) {

  const wobbleRef = useRef<THREE.Group>(null!);

  const [panelVisible, setPanelVisible] = useState(true);
  const prevSection = useRef(activeSection);

  useEffect(() => {
    if (prevSection.current === activeSection) return;
    // fade out, swap, fade in
    setPanelVisible(false);
    const timer = setTimeout(() => {
      prevSection.current = activeSection;
      setPanelVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeSection]);

  useGSAP(() => {
    gsap.to(wobbleRef.current.rotation, {
      y: 0.3, x: 0.1, ease: "none",
      scrollTrigger: {
        trigger: "#workspace-wrapper",
        start: "top top", end: "bottom bottom", scrub: true,
      },
    });
  }, []);


  const panel = () => {
    if (activeSection === 1) return <FakeEditor />;
    if (activeSection === 2) return <FakeDashboard />;
    if (activeSection === 3) return <FakeTerminal />;
    if (activeSection === 4) return <FakeCTA isLoggedIn={isLoggedIn} />;
    // default
  };

  const panelShift: Record<number, string> = {
    1: "translateX(180px)",  // text left → panel shifts right
    2: "translateX(-180px)", // text right → panel shifts left
    3: "translateX(180px)",  // text left → panel shifts right
    4: "translateX(0px)",    // centered
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (inside) {
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(1000px) rotateY(${x * 12}deg) rotateX(${-y * 8}deg) scale(1.02)`;
      } else {
        el.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)`;
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [panelVisible]);
  return (
    <group ref={wobbleRef}>
      <Html center>
        <div
          ref={wrapperRef}
          style={{
            opacity: panelVisible ? 1 : 0,
            transform: panelShift[activeSection] || "translateX(0px)",
            transition: "opacity 0.3s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)",
            pointerEvents: "auto",
          }}
        >
          <div
            ref={tiltRef}
            style={{ transition: "transform 0.15s ease", willChange: "transform" }}
          >
            {panel()}
          </div>
        </div>
      </Html>
    </group>
  );
}

function Atmosphere() {
  return (
    <>
      <Sparkles count={70} scale={[14, 8, 6]} size={2.5} speed={0.25} color="#F59E0B" opacity={0.5} />
      <Grid
        position={[0, -2.4, 0]} args={[20, 20]}
        cellColor="#1a1a1a" sectionColor="#D97706"
        sectionThickness={0.6} cellThickness={0.3}
        fadeDistance={18} fadeStrength={1} infiniteGrid
      />
    </>
  );
}

function CameraRig() {
  const { camera } = useThree();
  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#workspace-wrapper",
        start: "top top", end: "bottom bottom",
        scrub: true, onUpdate: () => camera.lookAt(0, 0, 0),
      },
    });
    tl.to(camera.position, { z: 4, x: -0.5, y: 0.2 })
      .to(camera.position, { z: 2.2, x: 0, y: 0 })
      .to(camera.position, { z: 1.4, x: 0.3, y: 0.1 })
      .to(camera.position, { z: 1.8, x: -0.4, y: 0.4 })
      .to(camera.position, { z: 4.5, x: -1, y: 1 })
      .to(camera.position, { z: 8, x: 1.5, y: 2 })
      .to(camera.position, { z: 5, x: 0, y: 0 });
  }, [camera]);
  return null;
}

// ============================================================
// SCROLL SECTION WRAPPER
// ============================================================

function ScrollSection({ heightVh, children }: { heightVh: number; children: React.ReactNode }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top", end: "+=90%", scrub: true,
      },
    });
    tl.to(contentRef.current, { opacity: 1, duration: 1 })
      .to(contentRef.current, { opacity: 1, duration: 0.3 })
      .to(contentRef.current, { opacity: 0, duration: 3 });
  }, []);

  return (
    <div ref={sectionRef} style={{ height: `${heightVh}vh`, position: "relative" }}>
      <div ref={contentRef} style={{ position: "fixed", inset: 0, opacity: 0  ,pointerEvents: "none"}}>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// SECTION COPY — single source of truth, read by both the desktop
// scroll overlays (Section*Text) and MobileWorkspace, so copy only
// ever lives in one place.
// ============================================================

const SECTIONS: {
  label: string;
  heading: React.ReactNode;
  description: string;
}[] = [
    {
      label: "// feature_01",
      heading: <>Real-time<br />multiplayer editing</>,
      description: "Multiple developers editing the same file simultaneously — powered by Yjs CRDTs with colored cursors per user.",
    },
    {
      label: "// feature_02",
      heading: <>Project dashboard & collaboration</>,
      description: "Manage projects, invite collaborators, track files and leave threaded comments — all in one place.",
    },
    {
      label: "// feature_03",
      heading: <>Sandboxed <br /> terminal & <br /> Docker execution</>,
      description: "Run code in isolated Docker containers directly from the browser. No local setup required.",
    },
    {
      label: "// initialize your First Project",
      heading: <>Ready to ship<br /><span style={{ color: "#F59E0B" }}>from the cloud?</span></>,
      description: "No setup. No local installs. Just open a tab and start collaborating.",
    },
  ];

// Section text overlays — left/right side narrative text per section
function Section1Text() {
  const s = SECTIONS[0];
  return (
    <ScrollSection heightVh={150}>
      <div style={{ position: "absolute", left: 48, top: "70%", transform: "translateY(-50%)", maxWidth: 340 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#F59E0B", marginBottom: 12 }}>{s.label}</div>
        <h2 style={{ fontFamily: "var(--font-geist-pixel-circle)", fontWeight: 500, fontSize: "clamp(3rem,5vw,5rem)", color: "#ECF0F1", lineHeight: 1.1, marginBottom: 16 }}>
          {s.heading}
        </h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#a4b4b5", lineHeight: 1.8 }}>
          {s.description}
        </p>
      </div>
    </ScrollSection>
  );
}

function Section2Text() {
  const s = SECTIONS[1];
  return (
    <ScrollSection heightVh={150}>
      <div style={{ position: "absolute", right: 48, top: "70%", transform: "translateY(-50%)", maxWidth: 340, textAlign: "right" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#F59E0B", marginBottom: 12 }}>{s.label}</div>
        <h2 style={{ fontFamily: "var(--font-geist-pixel-circle)", fontWeight: 500, fontSize: "clamp(2rem,4.5vw,5rem)", color: "#ECF0F1", lineHeight: 1.1, marginBottom: 16 }}>
          {s.heading}
        </h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#7F8C8D", lineHeight: 1.8 }}>
          {s.description}
        </p>
      </div>
    </ScrollSection>
  );
}

function Section3Text() {
  const s = SECTIONS[2];
  return (
    <ScrollSection heightVh={150}>
      <div style={{ position: "absolute", left: 48, top: "70%", transform: "translateY(-50%)", maxWidth: 440 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#F59E0B", marginBottom: 12 }}>{s.label}</div>
        <h2 style={{ fontFamily: "var(--font-geist-pixel-circle)", fontWeight: 500, fontSize: "clamp(2rem,4vw,5rem)", color: "#ECF0F1", lineHeight: 1.1, marginBottom: 16 }}>
          {s.heading}
        </h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#7F8C8D", lineHeight: 1.8 }}>
          {s.description}
        </p>
      </div>
    </ScrollSection>
  );
}

function Section4Text() {
  const s = SECTIONS[3];
  return (
    <ScrollSection heightVh={150}>
      <div style={{ position: "absolute", right: 556, top: "80%", transform: "translateY(-50%)", maxWidth: 340, textAlign: "center", fontFamily: "var(--font-geist-pixel-circle)", fontWeight: 500 }}>
        <div style={{ fontSize: 11, color: "#F59E0B", marginBottom: 12 }}>{s.label}</div>
      </div>
    </ScrollSection>
  );
}

// ============================================================
// MOBILE — static panels (no typing animation, no fixed pixel widths)
// ============================================================

function MobileEditorPanel() {
  const lines = [
    { text: "const session = await collab.join(roomId);", user: "Kaivalya", color: "#F59E0B" },
    { text: "session.onCursorMove((user, pos) => {", user: "Sarah", color: "#A855F7" },
    { text: "  renderCursor(user.color, pos);", user: "Ishu", color: "#22C55E" },
    { text: "});", user: "Rohan", color: "#3B82F6" },
  ];
  return (
    <div style={{
      width: "100%", background: "#0d0d0d", border: "1px solid #1a1a1a",
      borderRadius: 10, overflow: "hidden", fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid #1a1a1a", background: "#111" }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ marginLeft: 10, fontSize: 10, color: "#7F8C8D" }}>collab-ide · filename.ts</span>
      </div>
      <div style={{ padding: "12px 0" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", padding: "3px 14px", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ width: 18, color: "rgba(127,140,141,0.3)", fontSize: 10, flexShrink: 0 }}>{i + 1}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, color: "#fff", background: l.color,
              padding: "1px 6px", borderRadius: 3, flexShrink: 0,
            }}>{l.user}</span>
            <span style={{ fontSize: 11, color: "#ECF0F1", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileDashboardPanel() {
  const stats = [
    { label: "PROJECTS", value: "2" },
    { label: "COLLABORATORS", value: "4" },
    { label: "FILES", value: "12" },
    { label: "AI_COMPLETIONS", value: "∞" },
  ];
  return (
    <div style={{
      width: "100%", background: "#0d0d0d", border: "1px solid #1a1a1a",
      borderRadius: 10, padding: 16, fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#ECF0F1", marginBottom: 12 }}>hello, kaivalya_dev()</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontSize: 8, color: "#F59E0B", marginBottom: 4 }}>● {s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ECF0F1" }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileTerminalPanel() {
  const lines = [
    "/tmp/workspace # docker run node:18-alpine",
    "✓ Pull complete",
    "/tmp/workspace # node filename.ts",
    "Result: 30",
    "/tmp/workspace # _",
  ];
  return (
    <div style={{
      width: "100%", background: "#000", border: "1px solid #1a1a1a",
      borderRadius: 10, padding: 14, fontFamily: "'JetBrains Mono', monospace",
    }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 11, color: i % 2 === 0 ? "#5fbf77" : "#ECF0F1", lineHeight: 1.8, wordBreak: "break-all" }}>
          {l}
        </div>
      ))}
    </div>
  );
}

function MobileCTAPanel() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  return (
    <a href={isLoggedIn ? "/dashboard" : "/api/auth/signin"} target="_blank" rel="noreferrer" style={{
      display: "block", width: "100%", textAlign: "center",
      background: "#F59E0B", color: "#1a1206", fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700, fontSize: 14, padding: "14px 0", borderRadius: 8,
      textDecoration: "none",
    }}>
      launch_ide() →
    </a>
  );
}

const MOBILE_PANELS = [MobileEditorPanel, MobileDashboardPanel, MobileTerminalPanel, MobileCTAPanel];

// ============================================================
// MOBILE WORKSPACE — static vertical card stack, replaces the
// sticky-Canvas + scroll-triggered sections on screens < 768px
// ============================================================

function MobileWorkspace() {
  return (
    <div style={{ padding: "56px 22px 88px", display: "flex", flexDirection: "column", gap: 72 }}>
      {SECTIONS.map((s, i) => {
        const Panel = MOBILE_PANELS[i];
        const isLast = i === SECTIONS.length - 1;
        return (
          <div key={i}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#F59E0B" }}>
                {s.label}
              </div>
              <h2 style={{
                fontFamily: "var(--font-geist-pixel-circle)", fontWeight: 500,
                fontSize: "clamp(1.6rem, 7vw, 2.2rem)", color: "#ECF0F1", lineHeight: 1.2,
                margin: 0,
              }}>
                {s.heading}
              </h2>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#7F8C8D",
                lineHeight: 1.75, margin: 0, maxWidth: "34ch",
              }}>
                {s.description}
              </p>
              <div style={{ marginTop: 6 }}>
                <Panel />
              </div>
            </div>
            {!isLast && (
              <div style={{
                marginTop: 56, height: 1,
                background: "linear-gradient(to right, transparent, #1a1a1a 20%, #1a1a1a 80%, transparent)",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// BLACK FADE OVERLAY
// ============================================================

function BlackFadeOverlay({ totalSections }: { totalSections: number }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    function update() {
      const vh = window.innerHeight;
      const sectionIndex = window.scrollY / vh;
      const nearestBoundary = Math.round(sectionIndex);
      if (nearestBoundary <= 0 || nearestBoundary >= totalSections) { el!.style.opacity = "0"; return; }
      const distance = Math.abs(sectionIndex - nearestBoundary);
      const fadeWindow = 0.1;
      el!.style.opacity = String(Math.max(0, 1 - distance / fadeWindow));
    }
    window.addEventListener("scroll", () => requestAnimationFrame(update));
    update();
    return () => window.removeEventListener("scroll", update);
  }, [totalSections]);
  return (
    <div ref={overlayRef} style={{ position: "fixed", inset: 0, background: "#000", opacity: 0, pointerEvents: "none", zIndex: 9999 }} />
  );
}

// ============================================================
// HUD — receives activeSection as prop
// ============================================================

const HUD_CONFIG = [
  { status: "INITIALIZING", users: "–", latency: "–ms" },
  { status: "MULTIPLAYER_SYNC", users: "4", latency: "12ms" },
  { status: "WORKSPACE_MATRIX", users: "4", latency: "8ms" },
  { status: "SANDBOX_ACTIVE", users: "4", latency: "3ms" },
  { status: "DEPLOYING", users: "4", latency: "1ms" },
];

function HUD({ activeSection, visible }: { activeSection: number; visible: boolean }) {
  return (
    <div style={{
      position: "fixed", top: 90, left: 30,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
      color: "#F5A623", lineHeight: 1.8, pointerEvents: "none",
      zIndex: 999, opacity: visible ? 0.75 : 0,
      transition: "opacity 0.6s ease",
    }}>
      <div>// {HUD_CONFIG[activeSection].status}</div>
      <div>// USERS: {HUD_CONFIG[activeSection].users}</div>
      <div>// LATENCY: {HUD_CONFIG[activeSection].latency}</div>
    </div>
  );
}


// ============================================================
// FOOTER
// ============================================================

function FooterLink({ label, href }: { label: string; href: string }) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  return (
    <a
      ref={linkRef}
      href={href}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => {
        if (!linkRef.current) return;
        linkRef.current.style.color = "#F59E0B";
        linkRef.current.style.paddingLeft = "20px";
      }}
      onMouseLeave={() => {
        if (!linkRef.current) return;
        linkRef.current.style.color = "#BDC3C7";
        linkRef.current.style.paddingLeft = "0px";
      }}
      style={{
        display: "block",
        position: "relative",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: "#BDC3C7",
        textDecoration: "none",
        marginBottom: 10,
        paddingLeft: 0,
        transition: "color 0.2s, padding-left 0.2s",
      }}
    >
      <span
        className="footer-prefix"
        style={{
          position: "absolute", left: 0, top: 0,
          color: "#F59E0B", fontSize: 12,
          fontWeight: 700, opacity: 0,
          transition: "opacity 0.2s",
        }}
      >
                //
      </span>
      {label}
    </a>
  );
}


function Footer() {
  const footerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useGSAP(() => {
    if (isMobile) {
      // The scroll-linked fade below relies on ScrollTrigger measuring
      // footerRef's position against the viewport. On mobile the wrapper's
      // height is now content-driven (fixed as part of the overflow fix),
      // which shifts that measurement around and made the trigger point
      // effectively unreachable — the content just stayed at opacity 0
      // forever. Mobile doesn't need a scroll-tied reveal here the way the
      // desktop's pinned 3D scene does, so just show it immediately.
      gsap.set(contentRef.current, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(contentRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, [isMobile]);

  const cols = [
    {
      heading: "// about",
      items: [
        { label: "collab_ide", href: "https://collab-ide-nine.vercel.app" },
        { label: "built_by kaivalya", href: "https://github.com/Kaivalyakulkarni" },
        { label: "full_stack_ide", href: "#" },
      ]
    },
    {
      heading: "// links",
      items: [
        { label: "live_demo()", href: "https://collab-ide-nine.vercel.app" },
        { label: "github_repo", href: "https://github.com/Kaivalyakulkarni/collab-Ide" },
        { label: "open_in_ide()", href: "https://collab-ide-nine.vercel.app" },
      ]
    },
    {
      heading: "// stack",
      items: [
        { label: "Next.js + TypeScript", href: "#" },
        { label: "Yjs CRDTs", href: "#" },
        { label: "Docker + node-pty", href: "#" },
        { label: "Groq AI (llama-3.3)", href: "#" },
      ]
    },
  ];

  return (
    <div ref={footerRef} id="footer-wrapper" style={{ position: "relative", width: "100%", minHeight: "100vh", overflow: "hidden" }}>

      {/* Shader Gradient */}
      <ShaderGradientCanvas style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <ShaderGradient
          animate="on"
          brightness={0.85}
          cAzimuthAngle={180}
          cDistance={2.8}
          cPolarAngle={52}
          cameraZoom={1}
          color1="#050505"
          color2="#F59E0B"
          color3="#4F46E5"
          envPreset="city"
          grain="on"
          lightType="env"
          positionX={0}
          positionY={0.2}
          positionZ={0}
          reflection={0.1}
          rotationX={-40}
          rotationY={0}
          rotationZ={0}
          shader="defaults"
          type="waterPlane"
          uAmplitude={5}
          uDensity={1.2}
          uFrequency={2.5}
          uSpeed={0.25}
          uStrength={2.5}
          wireframe={false}
        />
      </ShaderGradientCanvas>

      {/* dark overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(to bottom, rgba(5,5,5,0.75) 0%, rgba(5,5,5,0.5) 50%, rgba(5,5,5,0.85) 100%)",
      }} />

      {/* watermark */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        fontFamily: "'Inter', sans-serif", fontWeight: 900,
        fontSize: "clamp(5rem, 14vw, 12rem)",
        color: "rgba(245,158,11,0.04)",
        whiteSpace: "nowrap", userSelect: "none", zIndex: 2,
        letterSpacing: "-0.04em",
      }}>
        collab_ide
      </div>

      {/* content */}
      <div ref={contentRef} className="footer-content" style={{
        position: "absolute", inset: 0, zIndex: 3,
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 48px 0 48px",
        opacity: 0,
      }}>
        {/* logo + tagline */}
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700, fontSize: "1.1rem",
            color: "#F59E0B", marginBottom: 8,
          }}>
            collab<span style={{ opacity: 0.5 }}>_</span>ide
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.78rem", color: "#7F8C8D",
            maxWidth: 400, lineHeight: 1.7,
          }}>
            {"// a full-stack browser IDE — real-time multiplayer,"}
            <br />
            {"// sandboxed execution, AI completions, git. no setup."}
          </div>
        </div>

        {/* columns */}
        <div className="footer-cols" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40, maxWidth: 720 }}>
          {cols.map((col, ci) => (
            <div key={ci}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: "#F59E0B",
                marginBottom: 16, letterSpacing: "0.05em",
              }}>
                {col.heading}
              </div>
              {col.items.map((item, ii) => (
                <FooterLink key={ii} label={item.label} href={item.href} />
              ))}
            </div>
          ))}
        </div>

        {/* status bar */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 0",
          display: "flex", alignItems: "center", gap: 24,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, color: "#7F8C8D",
          flexWrap: "wrap",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 6px #22C55E" }} />
            connected
          </span>
          <span style={{ color: "#3a3a3a" }}>•</span>
          <span>main</span>
          <span style={{ color: "#3a3a3a" }}>•</span>
          <span>TypeScript</span>
          <span style={{ color: "#3a3a3a" }}>•</span>
          <span style={{ marginLeft: "auto", color: "#F59E0B" }}>COLLAB_IDE_V1.0</span>
        </div>
      </div>
      <style>{`
        a:hover .footer-prefix { opacity: 1 !important; }

        @media (max-width: 768px) {
          /* The desktop layout pins .footer-content with position:absolute
             + inset:0 inside a 100vh wrapper with overflow:hidden. On mobile
             the columns stack to 1-per-row (below) and need far more vertical
             space than 100vh — with the absolute+hidden setup that overflow
             was being silently clipped, which is why the footer links were
             invisible. Switching to a normal flow layout lets the wrapper
             grow to fit its content instead of clipping it. */
          #footer-wrapper {
            min-height: auto !important;
            overflow: visible !important;
          }
          .footer-content {
            position: relative !important;
            inset: auto !important;
            padding: 48px 22px 40px 22px !important;
            gap: 40px;
          }
          .footer-cols { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </div>
  );
}



// ============================================================
// PAGE — activeSection lives here, passed down to HUD + WorkspaceScene
// ============================================================

export default function Page() {
  const TOTAL_SECTIONS = 9;
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // ← lifted state
  const [activeSection, setActiveSection] = useState(0);
  const [hudVisible, setHudVisible] = useState(false);


  useGSAP(() => {
    // On mobile the Canvas/workspace-wrapper/section markers never render,
    // so none of this scroll-trigger wiring has anything to attach to —
    // skip it entirely rather than let GSAP warn on missing triggers.
    if (isMobile) return;

    gsap.fromTo(canvasWrapperRef.current, { opacity: 0 }, {
      opacity: 1, scale: 1, ease: "none",
      scrollTrigger: {
        trigger: "#hero-wrapper", start: "top top", end: "bottom top", scrub: true,
      },
    });

    // HUD visibility
    ScrollTrigger.create({
      trigger: "#workspace-wrapper",
      start: "top center",
      onEnter: () => setHudVisible(true),
      onLeaveBack: () => setHudVisible(false),
    });

    ScrollTrigger.create({
      trigger: "#footer-wrapper",
      start: "top center",
      onEnter: () => setHudVisible(false),
      onLeaveBack: () => setHudVisible(true),
    });

    // Navbar hide on footer
    ScrollTrigger.create({
      trigger: "#footer-wrapper",
      start: "top bottom",
      onEnter: () => {
        const nav = document.querySelector(".hero-nav") as HTMLElement | null;
        if (!nav) return;
        nav.style.opacity = "0";
        nav.style.pointerEvents = "none";
      },
      onLeaveBack: () => {
        const nav = document.querySelector(".hero-nav") as HTMLElement | null;
        if (!nav) return;
        nav.style.opacity = "1";
        nav.style.pointerEvents = "auto";
      },
    });

    // Section detection
    ScrollTrigger.create({
      trigger: "#section-1", start: "top center", end: "bottom center",
      onEnter: () => setActiveSection(1), onEnterBack: () => setActiveSection(1),
    });
    ScrollTrigger.create({
      trigger: "#section-2", start: "top center", end: "bottom center",
      onEnter: () => setActiveSection(2), onEnterBack: () => setActiveSection(2),
    });
    ScrollTrigger.create({
      trigger: "#section-3", start: "top center", end: "bottom center",
      onEnter: () => setActiveSection(3), onEnterBack: () => setActiveSection(3),
    });
    ScrollTrigger.create({
      trigger: "#section-4", start: "top center", end: "bottom center",
      onEnter: () => setActiveSection(4), onEnterBack: () => setActiveSection(4),
    });
  }, [isMobile]);

  return (
    <div style={{ position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap" rel="stylesheet" />

      <HeroSection />

      <div id="stack-section" style={{
        marginTop: isMobile ? 48 : 100,
        background: "#05050511",
        borderTop: "1px solid #1a1a1a",
        borderBottom: "1px solid #1a1a1a",
        padding: "18px 0",
      }}>
        <Marquee />
        <div style={{ marginTop: 40 }}>
          <Marquee isReversed />
        </div>
      </div>

      {isMobile ? (
        <MobileWorkspace />
      ) : (
        <div id="workspace-wrapper" style={{ position: "relative" }}>
          <div style={{ position: "sticky", top: 0, height: "100vh", zIndex: 0, overflow: "hidden" }}>
            <div ref={canvasWrapperRef} style={{ width: "100%", height: "100%" }}>
              <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
                <ambientLight intensity={0.4} color="#3a3a4a" />
                <pointLight position={[3, 2, 4]} intensity={25} color="#F59E0B" />
                <pointLight position={[-4, -2, -2]} intensity={10} color="#6366F1" />
                <CameraRig />
                <WorkspaceScene activeSection={activeSection} isLoggedIn={isLoggedIn} />
                <Atmosphere />
                <EffectComposer>
                  <Bloom intensity={0.6} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
                </EffectComposer>
              </Canvas>
            </div>
          </div>

          <div id="section-1"><Section1Text /></div>
          <div id="section-2"><Section2Text /></div>
          <div id="section-3"><Section3Text /></div>
          <div id="section-4"><Section4Text /></div>
          <div style={{ height: "100vh" }} />
        </div>
      )}

      <Footer />

      {!isMobile && <HUD activeSection={activeSection} visible={hudVisible} />}
      {!isMobile && <BlackFadeOverlay totalSections={TOTAL_SECTIONS} />}
    </div>
  );
}