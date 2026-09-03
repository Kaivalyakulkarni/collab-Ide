"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import styles from "../landing.module.css";
import style from "./dashboard.module.css";
import Loader from "@/components/Loader";
import { slugifyRepoName } from "@/lib/githubUtils";
import ImportRepoModal from "@/components/ImportRepoModal";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ALL hooks must be here, before any returns
  const [activePannel, setActivePanel] = useState<
    "overview" | "projects" | "settings"
  >("overview"); // overview, projects, collaborators, settings
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const [isCreating, setIsCreating] = useState(false);

  const [createGithubRepo, setCreateGithubRepo] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [filter, setFilter] = useState("all");

  const filteredProjects =
    filter === "all" ? projects : projects.filter((p) => p.status === filter);

  const [aiCompletions, setAiCompletions] = useState(true);

  const [githubStatus, setGithubStatus] = useState<{
    connected: boolean;
    githubLogin: string | null;
  }>({
    connected: false,
    githubLogin: null,
  });

  const [theme, setTheme] = useState("dark");

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
          createGithubRepo: createGithubRepo && githubStatus.connected,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data?.error || "Failed to create project");
        setIsCreating(false);
        return;
      }

      setProjects((prev) => [...prev, data]);
      setShowModal(false);
      setNewProjectName("");
      setNewProjectDesc("");
      setCreateGithubRepo(false);
      setIsCreating(false);
      setActivePanel("projects");
      setFilter("active");
    } catch (err) {
      setCreateError("Network error — please try again");
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status]);

  useEffect(() => {
    const handleClickOutside = () => setUserMenuOpen(false);
    if (userMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    fetch("/api/github/status")
      .then((res) => res.json())
      .then((data) => setGithubStatus(data))
      .catch((err) => console.error("github status fetch error:", err));
  }, []);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        console.log("projects data:", data);
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => console.error("fetch error:", err));
  }, []);

  // early returns AFTER all hooks
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen w-screen">
        {/* <div
                className="mx-auto w-[500px] bg-gray-950 rounded-xl overflow-hidden drop-shadow-xl"
            >

                <div className="bg-[#333] flex items-center p-[5px] text-whitec relative">
                    <div className="flex absolute left-3">
                        <span className="h-3.5 w-3.5 bg-[#ff605c] rounded-xl mr-2"></span>
                        <span className="h-3.5 w-3.5 bg-[#ffbd44] rounded-xl mr-2"></span>
                        <span className="h-3.5 w-3.5 bg-[#00ca4e] rounded-xl"></span>
                    </div>
                    <div className="flex-1 text-center text-white font-(font-family: var(--font-geist-pixel-circle)) text-xl">status</div>
                </div>
                <div className="p-2.5 text-[#0f0]">
                    <div>
                        <span className="mr-2">Loading</span>
                        <span className="animate-[ping_1.5s_0.5s_ease-in-out_infinite]">.</span>
                        <span className="animate-[ping_1.5s_0.7s_ease-in-out_infinite]">.</span>
                        <span className="animate-[ping_1.5s_0.9s_ease-in-out_infinite]">.</span>
                    </div>
                </div>
            </div> */}
        <Loader />
      </div>
    );
  }
  if (!session) return null;

  const name = session.user?.name;
  const initial = name?.charAt(0);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;

  const allMemberIds = new Set(
    projects.flatMap((p) => p.members.map((m: any) => m.userId)),
  );
  const totalCollaborators = allMemberIds.size;

  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 3);

  const activityEvents = projects
    .flatMap((p) => [
      {
        type: "CREATE",
        label: `Created ${p.name}`,
        sub: `new project`,
        time: new Date(p.createdAt),
        project: p.name,
      },
      {
        type: "UPDATE",
        label: `Updated ${p.name}`,
        sub: `files or settings changed`,
        time: new Date(p.updatedAt),
        project: p.name,
      },
    ])
    .filter((e, i, arr) => {
      // drop UPDATE if it's the same time as CREATE (just created, never edited)
      if (e.type === "UPDATE") {
        const create = arr.find(
          (x) => x.type === "CREATE" && x.project === e.project,
        );
        if (create && Math.abs(e.time.getTime() - create.time.getTime()) < 1000)
          return false;
      }
      return true;
    })
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 5);

  return (
    <div>
      {/* Indentation Guides */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div className={styles.indentGuide} style={{ left: "240px" }}></div>
        <div className={styles.indentGuide} style={{ right: "80px" }}></div>
      </div>

      {/* NavBar */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 50,
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #1a1a1a",
          background: "rgba(5,5,5,0.6)",
          height: "56px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 25px",
            height: "100%",
            width: "100%",
            maxWidth: "1440px",
            margin: "0 auto",
          }}
        >
          {/* Logo + tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              height: "100%",
            }}
          >
            {/* Logo */}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: ".9rem",
                fontWeight: "bold",
                color: "#BDC3C7",
                cursor: "pointer",
              }}
              onClick={() => router.push("/")}
            >
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

            {/* tabs */}
            <div className={style.navTabs}>
              <a
                href="#"
                onClick={() => setActivePanel("overview")}
                className={`${styles.navTab} ${activePannel === "overview" ? styles.navTabActive : styles.navTabInActive}`}
                style={{
                  padding: "0 20px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "12px",
                  fontFamily: "var(--font-jetbrains-mono),monospace",
                  gap: "8px",
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                dashboard.tsx
              </a>
              <a
                href="#"
                onClick={() => setActivePanel("projects")}
                className={`${styles.navTab} ${activePannel === "projects" ? styles.navTabActive : styles.navTabInActive}`}
                style={{
                  padding: "0 20px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "12px",
                  fontFamily: "var(--font-jetbrains-mono),monospace",
                  gap: "8px",
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                projects.json
              </a>
              <a
                href="#"
                onClick={() => setActivePanel("settings")}
                className={`${styles.navTab} ${activePannel === "settings" ? styles.navTabActive : styles.navTabInActive}`}
                style={{
                  padding: "0 20px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "12px",
                  fontFamily: "var(--font-jetbrains-mono),monospace",
                  gap: "8px",
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
                settings.ts
              </a>
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div className={style.userMenuWrapper}>
              <button
                className={`${style.userMenuTrigger} text-[13px] lowercase text-gray-500 flex gap-2 items-center`}
                style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen((prev) => !prev);
                }}
              >
                <div className="w-6 h-6 rounded-full bg-zinc-900 text-center flex items-center justify-center px-4 py-4 uppercase text-green-600 text-[12px] font-bold">{`${initial}`}</div>
                {`${session.user?.name}_dev`}
              </button>

              {userMenuOpen && (
                <div
                  className={style.userMenuDropdown}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={style.userMenuItem}
                    onClick={() => {
                      setActivePanel("settings");
                      setUserMenuOpen(false);
                    }}
                  >
                    settings()
                  </button>
                  <button
                    className={`${style.userMenuItem} ${style.userMenuItemDanger}`}
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    logout()
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Layout */}
      <div className={`relative flex pt-14 min-h-[100vh] z-1`}>
        {/* SideBar */}
        <aside className={`${style.sideBar}`}>
          <div className="px-4 mb-8">
            <div
              className="uppercase mb-3 px-2 text-[10px]"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                letterSpacing: "0.15em",
                color: "#7F8C8D",
              }}
            >
              {" "}
              workspace
            </div>
            <a
              href="#"
              onClick={() => setActivePanel("overview")}
              className={`${style.sidebarItem} ${activePannel === "overview" ? style.sidebarItemActive : ""} flex text-center items-center justify-start gap-3 px-3 py-2 rounded `}
              style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}
            >
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
            </a>
            <a
              href="#"
              onClick={() => setActivePanel("projects")}
              className={`${style.sidebarItem} ${activePannel === "projects" ? style.sidebarItemActive : ""}  flex text-center items-center justify-start gap-3 px-3 py-2 rounded `}
              style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}
            >
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
              <span className={`${style.sidebarBadge}`}>{totalProjects}</span>
            </a>
          </div>
          <div className={`${style.sidebarSection}`}>
            <div
              className={`${style.sidebarLabel}`}
              style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}
            >
              recent
            </div>
            {recentProjects.map((p) => (
              <a
                key={p.id}
                href="#"
                onClick={() => router.push(`/projects/${p.id}`)}
                className={`${style.sidebarItem} flex text-center items-center gap-3 px-3 py-2 rounded`}
                style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}
              >
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
                {p.name}
              </a>
            ))}
          </div>
        </aside>
        {/* Main */}
        <main className={`${style.main}`} style={{ paddingBottom: "48px" }}>
          {/* overview */}
          {activePannel === "overview" && (
            <>
              {/* Header */}
              <div className={`${style.dashboardHeader}`}>
                <div>
                  <div
                    className={`${style.greeting}`}
                    style={{
                      fontFamily: "var(--font-jetbrains-mono),monospace",
                    }}
                  >
                    // dashboard.init()
                  </div>

                  <div className={`${style.greetingName}`}>
                    hello, {`${session.user?.name}_dev()`}
                  </div>

                  <div
                    className={`${style.greetingSub}`}
                    style={{
                      fontFamily: "var(--font-jetbrains-mono),monospace",
                    }}
                  >
                    active_session: collab-ide · {totalProjects} projects ·
                    last_updated:{" "}
                    {recentProjects[0]
                      ? new Date(
                          recentProjects[0].updatedAt,
                        ).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
                <div className={`${style.headerActions}`}>
                  <button
                    className={`${style.btnOutline}`}
                    style={{
                      fontFamily: "var(--font-jetbrains-mono),monospace",
                    }}
                    onClick={() => setShowImportModal(true)}
                  >
                    import_repo()
                  </button>

                  <button
                    className={`${styles.btnFunc}`}
                    style={{
                      background: "#BDC3C7",
                      color: "#000",
                      padding: "5px 14px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onClick={() => setShowModal(true)}
                  >
                    + new_project()
                  </button>
                </div>
              </div>

              {/* stats */}
              <div
                className={`${style.statRow}`}
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                <div className={`${style.statCard}`}>
                  <div className={`${style.statLabel}`}>
                    <span
                      className={`${style.statDot}`}
                      style={{ background: "#4ade80" }}
                    ></span>
                    active_projects
                  </div>
                  <div className={`${style.statValue}`}>{activeProjects}</div>
                  <div className={`${style.statSub}`}>
                    {totalProjects} total
                  </div>
                </div>
                <div className={`${style.statCard}`}>
                  <div className={`${style.statLabel}`}>
                    <span
                      className={`${style.statDot}`}
                      style={{ background: "#60a5fa" }}
                    ></span>
                    collaborators
                  </div>
                  <div className={`${style.statValue}`}>
                    {totalCollaborators}
                  </div>
                  <div className={`${style.statSub}`}>across all projects</div>
                </div>
                <div className={`${style.statCard}`}>
                  <div className={`${style.statLabel}`}>
                    <span
                      className={`${style.statDot}`}
                      style={{ background: "#BDC3C7" }}
                    ></span>
                    total_files
                  </div>
                  <div className={`${style.statValue}`}>
                    {projects.reduce(
                      (acc, p) => acc + (p.files?.length || 0),
                      0,
                    )}
                  </div>
                  <div className={`${style.statSub}`}>across all projects</div>
                </div>
                <div className={`${style.statCard}`}>
                  <div className={`${style.statLabel}`}>
                    <span
                      className={`${style.statDot}`}
                      style={{ background: "#f59e0b" }}
                    ></span>
                    ai_completions
                  </div>
                  <div className={`${style.statValue}`}>—</div>
                  <div className={`${style.statSub}`}>groq powered</div>
                </div>
              </div>

              {/* Projects */}
              <div
                className={`${style.sectionHeader}`}
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                <div className={`${style.sectionTitle}`}>recent_projects</div>
                <a
                  href="#"
                  onClick={() => setActivePanel("projects")}
                  className={`${style.sectionLink}`}
                >
                  {"view_all() →"}
                </a>
              </div>

              {loading && (
                <div
                  style={{
                    color: "#7F8C8D",
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "12px",
                  }}
                >
                  loading projects...
                </div>
              )}

              <div
                className={`${style.projectGrid}`}
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                {/* projects */}
                {projects
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() -
                      new Date(a.updatedAt).getTime(),
                  )
                  .slice(0, 3)
                  .map((project) => (
                    <div
                      key={project.id}
                      className={`${style.projectCard}`}
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <div className={`${style.projectCardHeader}`}>
                        <div className={`${style.projectIcon}`}>
                          {project.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className={`${style.projectStatus}`}>
                          <span
                            className={`${style.statusDot}`}
                            style={{
                              background:
                                project.status === "active"
                                  ? "#4ade80"
                                  : project.status === "archived"
                                    ? "#7F8C8D"
                                    : "#60a5fa",
                            }}
                          ></span>
                          {project.status || "active"}
                        </div>
                      </div>
                      <div className={`${style.projectName} font-mono`}>
                        {project.name}
                      </div>
                      <div className={`${style.projectDesc}`}>
                        {project.description || "// No description provided"}
                      </div>
                      <div className={`${style.projectMeta}`}>
                        <div className={`${style.projectLang}`}>
                          <span
                            className={`${style.langDot} ${style.langTs}`}
                          ></span>{" "}
                          Typescript
                        </div>
                        <div className={`${style.projectCollaborators}`}>
                          {project.members.slice(0, 3).map((m: any) => (
                            <div key={m.id} className={`${style.collabAvatar}`}>
                              {m.userId.slice(0, 1).toUpperCase()}
                            </div>
                          ))}
                        </div>
                        <div className={`${style.projectTime}`}>
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Recent Activities */}
              <div
                className={`${style.sectionHeader}`}
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                <div className={`${style.sectionTitle}`}>recent_activities</div>
                <a href="#" className={`${style.sectionLink}`}>
                  {"view_log() →"}
                </a>
              </div>

              <div
                className={`${style.activityList}`}
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                {activityEvents.length === 0 && (
                  <div
                    style={{
                      padding: "16px 20px",
                      fontSize: "11px",
                      color: "#7F8C8D",
                    }}
                  >
                    // no activity yet
                  </div>
                )}
                {activityEvents.map((event, i) => (
                  <div key={i} className={`${style.activityItem}`}>
                    <div className={`${style.activityIcon}`}>
                      {event.type === "CREATE" ? "NEW" : "UPD"}
                    </div>
                    <div className={`${style.activityContent}`}>
                      <div className={`${style.activityTitle}`}>
                        {event.label}
                      </div>
                      <div className={`${style.activitySub}`}>
                        {event.sub} ·{" "}
                        <span
                          className={`${style.tag} ${event.type === "CREATE" ? style.tagCreate : style.tagCommit}`}
                        >
                          {event.type.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <div className={`${style.activityTime}`}>
                      {event.time.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* projects */}
          {activePannel === "projects" && (
            <>
              {/* Page title */}
              <div
                className={`${style.sectionHeader}`}
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                <div className={`${style.sectionTitle}`}>all_projects</div>
              </div>

              {/* Search bar */}
              <div className={`${style.searchBar}`}>
                <svg
                  width={14}
                  height={14}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#7F8C8D"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="search_projects('query')"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                />
                <span className={style.searchHint}>⌘K</span>
              </div>

              {/* Filter buttons */}
              <div
                style={{ display: "flex", gap: "6px", marginBottom: "24px" }}
              >
                {["all", "active", "idle", "archived"].map((f) => (
                  <button
                    key={f}
                    style={{
                      fontSize: "11px",
                      padding: "4px 12px",
                      borderRadius: "4px",
                      border: `1px solid ${filter === f ? "#BDC3C7" : "#252525"}`,
                      background: filter === f ? "#BDC3C7" : "transparent",
                      color: filter === f ? "#000" : "#7F8C8D",
                      cursor: "pointer",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/*Project Grid */}

              {loading && (
                <div
                  style={{
                    color: "#7F8C8D",
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "12px",
                  }}
                >
                  loading projects...
                </div>
              )}

              <div
                className={`${style.projectGrid}`}
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                {/* projects */}
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`${style.projectCard}`}
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div className={`${style.projectCardHeader}`}>
                      <div className={`${style.projectIcon}`}>
                        {project.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={`${style.projectStatus}`}>
                        <span
                          className={`${style.statusDot}`}
                          style={{
                            background:
                              project.status === "active"
                                ? "#4ade80"
                                : project.status === "archived"
                                  ? "#7F8C8D"
                                  : "#60a5fa",
                          }}
                        ></span>
                        {project.status || "active"}
                      </div>
                    </div>
                    <div className={`${style.projectName} font-mono`}>
                      {project.name}
                    </div>
                    <div className={`${style.projectDesc}`}>
                      {project.description || "// No description provided"}
                    </div>
                    <div className={`${style.projectMeta}`}>
                      <div className={`${style.projectLang}`}>
                        <span
                          className={`${style.langDot} ${style.langTs}`}
                        ></span>{" "}
                        Typescript
                      </div>
                      <div className={`${style.projectCollaborators}`}>
                        {project.members.slice(0, 3).map((m: any) => (
                          <div key={m.id} className={`${style.collabAvatar}`}>
                            {m.userId.slice(0, 1).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <div className={`${style.projectTime}`}>
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}

                {/* New project */}
                <div
                  className={`${style.projectCardNew}`}
                  onClick={() => setShowModal(true)}
                >
                  <div className={`${style.newIcon}`}>+</div>
                  <div className={`${style.newLabel}`}>{"new_project()"}</div>
                </div>
              </div>
            </>
          )}

          {/* settings */}
          {activePannel === "settings" && (
            <>
              {/* Page title */}
              <div
                className={`${style.sectionHeader}`}
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                <div className={`${style.sectionTitle}`}>settings</div>
              </div>

              {/* first field */}
              <div className={`${style.settingItem}`}>
                <div
                  className={`${style.settingInfo}`}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <div className={`${style.settingLabel} `}>display_name</div>
                  <div className={`${style.settingSublabel}`}>
                    your public name
                  </div>
                </div>
                <div
                  className={`${style.settingControl}`}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <input
                    className={`${style.settingInput}`}
                    type="text"
                    placeholder="your_name_dev"
                    value={session.user?.name || ""}
                    readOnly
                  ></input>
                </div>
              </div>

              {/* second field */}
              <div className={`${style.settingItem}`}>
                <div
                  className={`${style.settingInfo}`}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <div className={`${style.settingLabel} `}>email</div>
                  <div className={`${style.settingSublabel}`}>
                    your email address
                  </div>
                </div>
                <div
                  className={`${style.settingControl}`}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <input
                    className={`${style.settingInput}`}
                    type="email"
                    placeholder="your_email_dev"
                    value={session.user?.email || ""}
                    readOnly
                  ></input>
                </div>
              </div>

              {/* third field */}
              <div className={`${style.settingItem}`}>
                <div
                  className={`${style.settingInfo}`}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <div className={`${style.settingLabel} `}>ai_completion</div>
                  <div className={`${style.settingSublabel}`}>
                    groq ghost text
                  </div>
                </div>

                <label className={`${style.toggleSwitch}`}>
                  <input
                    type="checkbox"
                    checked={aiCompletions}
                    onChange={(e) => setAiCompletions(e.target.checked)}
                  />
                  <span className={style.toggleSlider}></span>
                </label>
              </div>

              {/* GitHub connection */}
              <div className={style.settingItem}>
                <div
                  className={style.settingInfo}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <div className={style.settingLabel}>github</div>
                  <div className={style.settingSublabel}>
                    {githubStatus.connected
                      ? `connected as @${githubStatus.githubLogin}`
                      : "connect your GitHub account to import repos and sync commits"}
                  </div>
                </div>
                {githubStatus.connected ? (
                  <div
                    style={{
                      background: "rgba(74,222,128,0.1)",
                      color: "#4ade80",
                      border: "1px solid rgba(74,222,128,0.3)",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    ✓ connected
                  </div>
                ) : (
                  <a
                    href="/api/github/connect"
                    style={{
                      background: "#1a1a1a",
                      color: "#ECF0F1",
                      border: "1px solid #252525",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      cursor: "pointer",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    connect_github()
                  </a>
                )}
              </div>

              {/* fourth field */}
              <div className={`${style.settingItem}`}>
                <div
                  className={`${style.settingInfo}`}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <div className={`${style.settingLabel} `}>theme</div>
                  <div className={`${style.settingSublabel}`}>
                    application theme
                  </div>
                </div>
                <div
                  className={`${style.settingControl}`}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <select
                    className={`${style.settingInput}`}
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>

              {/* logout */}
              <div className={style.settingItem}>
                <div
                  className={style.settingInfo}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <div className={style.settingLabel}>session</div>
                  <div className={style.settingSublabel}>
                    sign out of collab_ide on this device
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  style={{
                    background: "transparent",
                    color: "#7F8C8D",
                    border: "1px solid #252525",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    cursor: "pointer",
                  }}
                >
                  logout()
                </button>
              </div>

              {/* fifth field */}
              <div
                className={style.settingItem}
                style={{ borderBottom: "none" }}
              >
                <div
                  className={style.settingInfo}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <div
                    className={style.settingLabel}
                    style={{ color: "#f87171" }}
                  >
                    danger_zone
                  </div>

                  <div className={style.settingSublabel}>
                    permanently delete your account
                  </div>
                </div>
                <button
                  style={{
                    background: "rgba(248,113,113,0.1)",
                    color: "#f87171",
                    border: "1px solid rgba(248,113,113,0.3)",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    cursor: "pointer",
                  }}
                >
                  delete_account()
                </button>
              </div>
            </>
          )}
        </main>

        {/* Mobile bottom nav island */}
        <div className={style.mobileNavIsland}>
          <button
            onClick={() => setActivePanel("overview")}
            className={`${style.mobileNavItem} ${activePannel === "overview" ? style.mobileNavItemActive : ""}`}
          >
            <svg
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
          </button>

          <button
            onClick={() => setActivePanel("projects")}
            className={`${style.mobileNavItem} ${activePannel === "projects" ? style.mobileNavItemActive : ""}`}
          >
            <svg
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
            {totalProjects > 0 && (
              <span className={style.mobileNavBadge}>{totalProjects}</span>
            )}
          </button>
        </div>

        {/* FAB — sibling of the island, sits independently on top of the notch */}
        <button
          onClick={() => setShowModal(true)}
          className={style.mobileNavFab}
          aria-label="Create Project"
        >
          +
        </button>
      </div>
      {/* Status-Bar */}
      <div
        className={`${style.statusbar}`}
        style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}
      >
        <div className={`${style.statusItem}`}>
          <span className={`${style.statusActiveDot}`}></span>connected
        </div>
        <div className={`${style.statusItem}`}>collab-ide</div>
        <div className={`${style.statusItem}`}>TypeScript</div>
        <div className={`${style.statusItem} ml-auto`}>
          COLLAB_IDE_DASHBOARD_V1.0
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid #1a1a1a",
              borderRadius: "8px",
              padding: "32px",
              width: "480px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "11px",
                color: "#7F8C8D",
                letterSpacing: "0.15em",
              }}
            >
              {"// new_project()"}
            </div>

            <input
              type="text"
              placeholder="project_name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              style={{
                background: "#111111",
                border: "1px solid #1a1a1a",
                borderRadius: "4px",
                padding: "10px 14px",
                color: "#ECF0F1",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "13px",
                width: "100%",
                outline: "none",
              }}
            />

            <input
              type="text"
              placeholder="project_description (optional)"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              style={{
                background: "#111111",
                border: "1px solid #1a1a1a",
                borderRadius: "4px",
                padding: "10px 14px",
                color: "#ECF0F1",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "13px",
                width: "100%",
                outline: "none",
              }}
            />

            {/* GitHub repo checkbox */}
            <div style={{ width: "100%" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  color: githubStatus.connected ? "#ECF0F1" : "#555",
                  cursor: githubStatus.connected ? "pointer" : "not-allowed",
                }}
              >
                <input
                  type="checkbox"
                  checked={createGithubRepo}
                  disabled={!githubStatus.connected}
                  onChange={(e) => setCreateGithubRepo(e.target.checked)}
                  style={{
                    cursor: githubStatus.connected ? "pointer" : "not-allowed",
                  }}
                />
                also create a private GitHub repository
              </label>

              {!githubStatus.connected && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#7F8C8D",
                    marginTop: "6px",
                    paddingLeft: "24px",
                  }}
                >
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowModal(false);
                      setActivePanel("settings");
                    }}
                    style={{ color: "#60a5fa", textDecoration: "underline" }}
                  >
                    connect your GitHub account
                  </a>{" "}
                  first to enable this
                </div>
              )}

              {githubStatus.connected &&
                createGithubRepo &&
                newProjectName.trim() && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#7F8C8D",
                      marginTop: "6px",
                      paddingLeft: "24px",
                    }}
                  >
                    → will create:{" "}
                    <span style={{ color: "#4ade80" }}>
                      github.com/{githubStatus.githubLogin}/
                      {slugifyRepoName(newProjectName)}
                    </span>
                  </div>
                )}
            </div>

            {createError && (
              <div
                style={{
                  width: "100%",
                  fontSize: "11px",
                  color: "#f87171",
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                {createError}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                style={{
                  background: "#BDC3C7",
                  color: "#000",
                  padding: "5px 14px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setShowModal(false);
                  setCreateError(null);
                }}
              >
                cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={isCreating}
                style={{
                  background: isCreating ? "#7F8C8D" : "#BDC3C7",
                  color: "#000",
                  opacity: isCreating ? 0.6 : 1,
                  cursor: isCreating ? "not-allowed" : "pointer",
                  padding: "5px 14px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                }}
              >
                {isCreating ? "creating..." : "create_project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportRepoModal
          onClose={() => setShowImportModal(false)}
          onImport={(projectId) => {
            setShowImportModal(false);
            router.push(`/projects/${projectId}`);
          }}
        />
      )}
    </div>
  );
}
