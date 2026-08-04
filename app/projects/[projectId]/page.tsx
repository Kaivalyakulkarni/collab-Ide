"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "../../landing.module.css";
import style from "./projectDetails.module.css";
import Loader from "@/components/Loader";

function timeAgo(dateString: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000,
  );

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export default function ProjectDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);

  const [activePannel, setActivePanel] = useState<
    "projectDashboard" | "collaborators" | "settings"
  >("projectDashboard");

  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [inviteLink, setInviteLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [projectStatus, setProjectStatus] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
          setProjectStatus(data.status);
        } else {
          console.error("Failed to fetch project");
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!projectId) return;
    fetchProject();
  }, [projectId]);

  // close the dropdown when clicking anywhere outside it
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  if (status === "loading" || loading)
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
  if (!session) return null;
  if (!project) return <div>project not found</div>;

  const name = session.user?.name;

  const myRole = project?.members?.find(
    (m: any) => m.userId === session?.user?.id,
  )?.role;

  const initial = name?.charAt(0);

  const handleGenerateInvite = async () => {
    setIsGenerating(true);
    fetch(`/api/projects/${projectId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: inviteRole }),
    })
      .then((res) => res.json())
      .then((data) => {
        setInviteLink(data.url);
        setIsGenerating(false);
      });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshProject = () => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => setProject(data));
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    await fetch(`/api/projects/${projectId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    refreshProject();
  };

  const handleRemoveMember = async (memberId: string) => {
    await fetch(`/api/projects/${projectId}/members/${memberId}`, {
      method: "DELETE",
    });
    refreshProject();
  };

  const handleStatusChange = async () => {
    setStatusSaving(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: projectStatus }),
    });
    refreshProject();
    setStatusSaving(false);
  };

  const handleDeleteProject = async () => {
    if (deleteConfirm !== project.name) return;
    setIsDeleting(true);
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    router.push("/dashboard");
  };

  // Comment handlers

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setProject((prev: any) => ({
          ...prev,
          comments: [newComment, ...(prev.comments || [])],
        }));
        setCommentText("");
      } else {
        console.error("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setPostingComment(false);
    }
  };

  const handleCopyComment = (comment: any) => {
    navigator.clipboard.writeText(comment.content);
    setCopiedCommentId(comment.id);
    setTimeout(() => setCopiedCommentId(null), 1500);
    setOpenMenuId(null);
  };

  const startEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
    setOpenMenuId(null);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editText.trim() }),
        },
      );
      if (res.ok) {
        const updated = await res.json();
        setProject((prev: any) => ({
          ...prev,
          comments: prev.comments.map((c: any) =>
            c.id === commentId ? updated : c,
          ),
        }));
        cancelEditComment();
      } else {
        console.error("Failed to edit comment");
      }
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setOpenMenuId(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/comments/${commentId}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        setProject((prev: any) => ({
          ...prev,
          comments: prev.comments.filter((c: any) => c.id !== commentId),
        }));
      } else {
        console.error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const totalmembers = project?.members?.length || 0;

  return (
    <div>
      <div>
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
        {/* NAV */}
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
            {/* logo + breadcrumb */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
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
                onClick={() => router.push("/dashboard")}
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
              {/* Breadcrumb */}
              <span
                className={style.mobileBreadcrumb}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginLeft: "25px",
                  gap: "8px",
                  fontFamily: "monospace",
                  fontSize: ".7rem",
                  fontWeight: "600",
                  color: "#7F8C8D",
                }}
              >
                / dashboard / projects /<span>{project?.name}</span>
              </span>
            </div>
            {/* buttons */}
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {myRole && (
                <div
                  className={style.mobileRoleBadge}
                  style={{
                    background:
                      myRole === "OWNER"
                        ? "rgba(189,195,199,0.1)"
                        : myRole === "EDITOR"
                          ? "rgba(96,165,250,0.1)"
                          : "rgba(127,140,141,0.15)",
                    color:
                      myRole === "OWNER"
                        ? "#BDC3C7"
                        : myRole === "EDITOR"
                          ? "#60a5fa"
                          : "#7F8C8D",
                    display: "none",
                  }}
                >
                  {myRole}
                </div>
              )}
              <a
                href="#"
                className=" text-[13px] lowercase text-gray-500 flex gap-2 items-center"
                style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}
              >
                <div className="w-6 h-6 rounded-full bg-zinc-900 text-center flex items-center justify-center px-4 py-4 uppercase text-green-600 text-[12px] font-bold">{`${initial}`}</div>
                <span
                  className={style.mobileName}
                >{`${session.user?.name}_dev`}</span>
              </a>
            </div>
          </div>
        </nav>

        {/* LAYOUT */}
        <div className={`relative flex pt-14 min-h-[100vh] z-1`}>
          {/* SIDEBAR */}
          <aside className={`${style.sideBar}`}>
            <div className="flex flex-col">
              <div className="border-b border-gray-700/50 px-4 py-3 flex flex-col items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full bg-zinc-900 text-center flex items-center justify-center px-4 py-4 uppercase text-green-600 text-[16px] font-bold"
                  style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}
                >{`${initial}`}</div>
                <a
                  className="text-[14px] font-bold lowercase"
                  href="#"
                  style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}
                >{`${session.user?.name}_dev`}</a>

                {(() => {
                  const me = project?.members?.find(
                    (m: any) => m.userId === session?.user?.id,
                  );
                  if (!me) return null;
                  return (
                    <div
                      style={{
                        fontSize: "9px",
                        padding: "2px 8px",
                        borderRadius: "3px",
                        marginBottom: "6px",
                        background:
                          me.role === "OWNER"
                            ? "rgba(189,195,199,0.1)"
                            : me.role === "EDITOR"
                              ? "rgba(96,165,250,0.1)"
                              : "rgba(127,140,141,0.15)",
                        color:
                          me.role === "OWNER"
                            ? "#BDC3C7"
                            : me.role === "EDITOR"
                              ? "#60a5fa"
                              : "#7F8C8D",
                      }}
                    >
                      {me.role}
                    </div>
                  );
                })()}
              </div>
              <div className="flex-1 ">
                <div
                  className="uppercase mb-3 px-2 text-[10px] px-3"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    letterSpacing: "0.15em",
                    color: "#7F8C8D",
                    marginTop: "10px",
                  }}
                >
                  {" "}
                  project
                </div>

                <a
                  href="#"
                  onClick={() => setActivePanel("projectDashboard")}
                  className={`${style.sidebarItem} ${activePannel === "projectDashboard" ? style.sidebarItemActive : ""} flex text-center items-center justify-start gap-3 px-3 py-2`}
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
                  project_dashboard
                </a>
                <a
                  href="#"
                  onClick={() => setActivePanel("collaborators")}
                  className={`${style.sidebarItem} ${activePannel === "collaborators" ? style.sidebarItemActive : ""}  flex text-center items-center justify-start gap-3 px-3 py-2  `}
                  style={{ fontFamily: "var(--font-jetbrains-mono),monospace" }}
                >
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
                  <span className={`${style.sidebarBadge}`}>
                    {totalmembers}
                  </span>
                </a>
              </div>
              <div className="flex-1 ">
                <div
                  className="uppercase mb-3 px-2 text-[10px] px-3"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    letterSpacing: "0.15em",
                    color: "#7F8C8D",
                    marginTop: "10px",
                  }}
                >
                  {" "}
                  owner only
                </div>

                <a
                  href="#"
                  onClick={() => setActivePanel("settings")}
                  className={`${style.sidebarItem}  ${activePannel === "settings" ? style.sidebarItemActive : ""}  flex text-center items-center  gap-3 px-3 py-2 rounded`}
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
                    <div
                      className={`${style.projectComment}`}
                      style={{
                        fontSize: "11px",
                        color: "#7F8C8D",
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                    >
                      // project.init()
                    </div>
                    <div
                      className={`${style.projectTitleArea}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        margin: "8px 0",
                      }}
                    >
                      <div className={style.projectIconLg}>
                        {project?.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={style.projectTitle}>{project?.name}</div>
                    </div>
                    <div className={style.projectDesc}>
                      {project?.description || "// No description provided"}
                    </div>
                  </div>
                  <div className={style.headerActions}>
                    <button
                      onClick={() => router.push(`/editor/${projectId}`)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "#f59e0b",
                        color: "#1a1206",
                        padding: "12px 26px",
                        borderRadius: "999px",
                        fontSize: "14px",
                        fontWeight: "700",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        boxShadow: "0 6px 20px rgba(245, 158, 11, 0.35)",
                        transition:
                          "transform 0.15s ease, box-shadow 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.03)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 24px rgba(245, 158, 11, 0.45)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 6px 20px rgba(245, 158, 11, 0.35)";
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 9l-3 3 3 3m8-6l3 3-3 3m-6 3l4-12"
                        />
                      </svg>
                      open_in_ide()
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className={style.statRow}>
                  <div className={`${style.statCard}`}>
                    <div className={`${style.statLabel}`}>
                      <span
                        className={`${style.statDot}`}
                        style={{ background: "#4ade80" }}
                      ></span>
                      status
                    </div>
                    <div
                      className={`${style.statValue}`}
                      style={{
                        color:
                          project?.status === "active" ? "#4ade80" : "#7F8C8D",
                      }}
                    >
                      {project?.status || "active"}
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
                      {project?.members?.length || 0}
                    </div>
                    <div className={`${style.statSub}`}>members</div>
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
                      {project?.files?.filter((f: any) => f.type === "file")
                        .length || 0}
                    </div>
                    <div className={`${style.statSub}`}>across all dirs</div>
                  </div>
                  <div className={`${style.statCard}`}>
                    <div className={`${style.statLabel}`}>
                      <span
                        className={`${style.statDot}`}
                        style={{ background: "#f59e0b" }}
                      ></span>
                      last_updated
                    </div>
                    <div className={`${style.statValue}`}>
                      {project?.updatedAt
                        ? new Date(project.updatedAt).toLocaleDateString()
                        : "—"}
                    </div>
                    <div className={`${style.statSub}`}>{project?.name}</div>
                  </div>
                </div>

                <div className={style.contentGrid}>
                  {/* File Tree panel */}
                  <div className={style.panel}>
                    <div className={style.panelHeader}>
                      <div className={style.panelTitle}>file_structure</div>
                      <button
                        className={style.panelAction}
                        onClick={() => router.push(`/editor/${projectId}`)}
                      >
                        + go_to_editor
                      </button>
                    </div>
                    {project?.files
                      ?.sort((a: any, b: any) => a.path.localeCompare(b.path))
                      .map((file: any) => {
                        const depth =
                          file.path.split("/").filter(Boolean).length - 1;
                        return (
                          <div
                            key={file.id}
                            className={style.fileRow}
                            style={{ paddingLeft: `${20 + depth * 16}px` }}
                          >
                            <svg
                              width="14"
                              height="14"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke={
                                file.type === "folder" ? "#f59e0b" : "#60a5fa"
                              }
                              strokeWidth={2}
                            >
                              {file.type === "folder" ? (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                              ) : (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              )}
                            </svg>
                            <div className={style.fileName}>{file.name}</div>
                            <div
                              className={style.fileMsg}
                              style={{ fontSize: "10px", color: "#555" }}
                            >
                              {file.path}
                            </div>
                            <div className={style.fileTime}>
                              {new Date(file.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Collaborators preview panel */}
                  <div className={style.panel}>
                    <div className={style.panelHeader}>
                      <div className={style.panelTitle}>collaborators</div>

                      <button
                        className={style.panelAction}
                        style={{}}
                        onClick={refreshProject}
                      >
                        ↻
                      </button>
                      {myRole === "OWNER" && (
                        <button
                          className={style.panelAction}
                          onClick={() => setActivePanel("collaborators")}
                        >
                          + invite_member()
                        </button>
                      )}
                    </div>

                    {myRole === "OWNER" && (
                      <div
                        style={{
                          padding: "16px 20px",
                          borderBottom: "1px solid #1a1a1a",
                          fontFamily: "var(--font-jetbrains-mono)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#7F8C8D",
                            marginBottom: "12px",
                          }}
                        >
                          // generate_invite_link()
                        </div>

                        {/* Role selector */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "12px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#7F8C8D",
                              width: "40px",
                            }}
                          >
                            role
                          </span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {(["EDITOR", "VIEWER"] as const).map((r) => (
                              <button
                                key={r}
                                onClick={() => setInviteRole(r)}
                                style={{
                                  fontSize: "10px",
                                  padding: "3px 10px",
                                  borderRadius: "3px",
                                  border: `1px solid ${inviteRole === r ? "#BDC3C7" : "#252525"}`,
                                  background:
                                    inviteRole === r
                                      ? "#BDC3C7"
                                      : "transparent",
                                  color: inviteRole === r ? "#000" : "#7F8C8D",
                                  cursor: "pointer",
                                  fontFamily: "var(--font-jetbrains-mono)",
                                }}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={handleGenerateInvite}
                            disabled={isGenerating}
                            style={{
                              fontSize: "10px",
                              padding: "3px 12px",
                              borderRadius: "3px",
                              border: "1px solid #252525",
                              background: "transparent",
                              color: "#7F8C8D",
                              cursor: "pointer",
                              fontFamily: "var(--font-jetbrains-mono)",
                              marginLeft: "auto",
                            }}
                          >
                            {isGenerating ? "generating..." : "generate()"}
                          </button>
                        </div>

                        {/* Generated link */}
                        {inviteLink && (
                          <>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "#111",
                                border: "1px solid #1a1a1a",
                                borderRadius: "4px",
                                padding: "8px 12px",
                              }}
                            >
                              <span
                                style={{
                                  flex: 1,
                                  fontSize: "10px",
                                  color: "#7F8C8D",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {inviteLink}
                              </span>
                              <button
                                onClick={handleCopy}
                                style={{
                                  fontSize: "10px",
                                  color: copied ? "#4ade80" : "#BDC3C7",
                                  background: "transparent",
                                  border: "1px solid #252525",
                                  padding: "2px 8px",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  fontFamily: "var(--font-jetbrains-mono)",
                                  flexShrink: 0,
                                }}
                              >
                                {copied ? "copied!" : "copy()"}
                              </button>
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "rgba(127,140,141,0.5)",
                                marginTop: "6px",
                              }}
                            >
                              // expires in 24h · single use
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {project?.members?.map((member: any) => (
                      <div
                        key={member.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 20px",
                          borderBottom: "1px solid rgba(26,26,26,0.5)",
                          fontFamily: "var(--font-jetbrains-mono)",
                        }}
                      >
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "#1a1a1a",
                            border: "1px solid #252525",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "#BDC3C7",
                            flexShrink: 0,
                          }}
                        >
                          {member?.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#ECF0F1",
                              marginBottom: "2px",
                            }}
                          >
                            {member?.user?.name}
                          </div>
                          <div style={{ fontSize: "10px", color: "#7F8C8D" }}>
                            {member?.user?.email}
                          </div>
                        </div>
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "#252525",
                            flexShrink: 0,
                          }}
                        ></div>
                        <div
                          style={{
                            fontSize: "9px",
                            padding: "2px 8px",
                            borderRadius: "3px",
                            background:
                              member.role === "OWNER"
                                ? "rgba(189,195,199,0.1)"
                                : member.role === "EDITOR"
                                  ? "rgba(96,165,250,0.1)"
                                  : "rgba(127,140,141,0.15)",
                            color:
                              member.role === "OWNER"
                                ? "#BDC3C7"
                                : member.role === "EDITOR"
                                  ? "#60a5fa"
                                  : "#7F8C8D",
                          }}
                        >
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
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#7F8C8D",
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                    >
                      {project?.comments?.length || 0} threads
                    </span>
                  </div>

                  {/* Comment rows */}
                  {project?.comments?.map((comment: any) => {
                    const isAuthor = comment.userId === session?.user?.id;
                    const canDelete = isAuthor || myRole === "OWNER";
                    const canEdit = isAuthor;
                    const isEditing = editingCommentId === comment.id;

                    return (
                      <div
                        key={comment.id}
                        style={{
                          display: "flex",
                          gap: "12px",
                          padding: "14px 20px",
                          borderBottom: "1px solid rgba(26,26,26,0.5)",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "#1a1a1a",
                            border: "1px solid #252525",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "9px",
                            fontWeight: "700",
                            color: "#BDC3C7",
                            flexShrink: 0,
                          }}
                        >
                          {comment.user.name?.charAt(0).toUpperCase()}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#7F8C8D",
                              marginBottom: "4px",
                              fontFamily: "var(--font-jetbrains-mono)",
                            }}
                          >
                            <span style={{ color: "#BDC3C7" }}>
                              {comment.user.name}
                            </span>{" "}
                            · {timeAgo(comment.createdAt)}
                            {comment.updatedAt !== comment.createdAt && (
                              <span style={{ color: "rgba(127,140,141,0.5)" }}>
                                {" "}
                                (edited)
                              </span>
                            )}
                          </div>

                          {isEditing ? (
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                alignItems: "flex-end",
                              }}
                            >
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={2}
                                style={{
                                  flex: 1,
                                  background: "#111",
                                  border: "1px solid #1a1a1a",
                                  borderRadius: "4px",
                                  padding: "8px 12px",
                                  fontSize: "11px",
                                  color: "#ECF0F1",
                                  fontFamily: "var(--font-jetbrains-mono)",
                                  outline: "none",
                                  resize: "none",
                                }}
                              />
                              <button
                                onClick={() =>
                                  handleSaveEditComment(comment.id)
                                }
                                style={{
                                  background: "#BDC3C7",
                                  color: "#000",
                                  border: "none",
                                  padding: "8px 14px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  fontFamily: "var(--font-jetbrains-mono)",
                                  flexShrink: 0,
                                }}
                              >
                                save()
                              </button>
                              <button
                                onClick={cancelEditComment}
                                style={{
                                  background: "transparent",
                                  color: "#7F8C8D",
                                  border: "1px solid #252525",
                                  padding: "8px 14px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  fontFamily: "var(--font-jetbrains-mono)",
                                  flexShrink: 0,
                                }}
                              >
                                cancel()
                              </button>
                            </div>
                          ) : (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#ECF0F1",
                                lineHeight: "1.6",
                                fontFamily: "var(--font-jetbrains-mono)",
                              }}
                            >
                              {comment.content}
                            </div>
                          )}
                        </div>

                        {/* three-dot menu trigger */}
                        {!isEditing && (
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(
                                  openMenuId === comment.id ? null : comment.id,
                                );
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#7F8C8D",
                                cursor: "pointer",
                                fontSize: "14px",
                                padding: "2px 6px",
                                lineHeight: 1,
                              }}
                            >
                              ⋯
                            </button>

                            {openMenuId === comment.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: "absolute",
                                  top: "22px",
                                  right: 0,
                                  background: "#111",
                                  border: "1px solid #252525",
                                  borderRadius: "6px",
                                  minWidth: "120px",
                                  zIndex: 20,
                                  overflow: "hidden",
                                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                                }}
                              >
                                <button
                                  onClick={() => handleCopyComment(comment)}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    textAlign: "left",
                                    background: "transparent",
                                    border: "none",
                                    color: "#ECF0F1",
                                    fontSize: "11px",
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    fontFamily: "var(--font-jetbrains-mono)",
                                  }}
                                >
                                  {copiedCommentId === comment.id
                                    ? "copied!"
                                    : "copy()"}
                                </button>

                                {canEdit && (
                                  <button
                                    onClick={() => startEditComment(comment)}
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      textAlign: "left",
                                      background: "transparent",
                                      border: "none",
                                      color: "#ECF0F1",
                                      fontSize: "11px",
                                      padding: "8px 12px",
                                      cursor: "pointer",
                                      fontFamily: "var(--font-jetbrains-mono)",
                                    }}
                                  >
                                    edit()
                                  </button>
                                )}

                                {canDelete && (
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(comment.id)
                                    }
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      textAlign: "left",
                                      background: "transparent",
                                      border: "none",
                                      color: "#f87171",
                                      fontSize: "11px",
                                      padding: "8px 12px",
                                      cursor: "pointer",
                                      fontFamily: "var(--font-jetbrains-mono)",
                                      borderTop: "1px solid #1a1a1a",
                                    }}
                                  >
                                    delete()
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Comment input */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      padding: "14px 20px",
                      alignItems: "flex-end",
                      borderTop: "1px solid #1a1a1a",
                    }}
                  >
                    <textarea
                      placeholder="// add_comment()..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      style={{
                        flex: 1,
                        background: "#111",
                        border: "1px solid #1a1a1a",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        fontSize: "11px",
                        color: "#ECF0F1",
                        fontFamily: "var(--font-jetbrains-mono)",
                        outline: "none",
                        resize: "none",
                      }}
                      rows={2}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={postingComment || !commentText.trim()}
                      style={{
                        background: "#BDC3C7",
                        color: "#000",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor:
                          postingComment || !commentText.trim()
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          postingComment || !commentText.trim() ? 0.5 : 1,
                        fontFamily: "var(--font-jetbrains-mono)",
                        flexShrink: 0,
                      }}
                    >
                      {postingComment ? "posting..." : "add_comment()"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {activePannel === "collaborators" && (
              <>
                {/* Section header */}
                <div
                  className={style.sectionHeader}
                  style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                >
                  <div className={style.sectionTitle}>collaborators</div>
                  <button
                    onClick={refreshProject}
                    style={{
                      fontSize: "10px",
                      color: "#7F8C8D",
                      background: "transparent",
                      border: "1px solid #252525",
                      padding: "3px 10px",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}
                  >
                    ↻ refresh()
                  </button>
                </div>

                <div className={style.panel}>
                  {/* Invite section — owner only */}
                  {myRole === "OWNER" && (
                    <div
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid #1a1a1a",
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#7F8C8D",
                          marginBottom: "12px",
                        }}
                      >
                        // generate_invite_link()
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#7F8C8D",
                            width: "40px",
                          }}
                        >
                          role
                        </span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {(["EDITOR", "VIEWER"] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => setInviteRole(r)}
                              style={{
                                fontSize: "10px",
                                padding: "3px 10px",
                                borderRadius: "3px",
                                border: `1px solid ${inviteRole === r ? "#BDC3C7" : "#252525"}`,
                                background:
                                  inviteRole === r ? "#BDC3C7" : "transparent",
                                color: inviteRole === r ? "#000" : "#7F8C8D",
                                cursor: "pointer",
                                fontFamily: "var(--font-jetbrains-mono)",
                              }}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={handleGenerateInvite}
                          disabled={isGenerating}
                          style={{
                            fontSize: "10px",
                            padding: "3px 12px",
                            borderRadius: "3px",
                            border: "1px solid #252525",
                            background: "transparent",
                            color: "#7F8C8D",
                            cursor: "pointer",
                            fontFamily: "var(--font-jetbrains-mono)",
                            marginLeft: "auto",
                          }}
                        >
                          {isGenerating ? "generating..." : "generate()"}
                        </button>
                      </div>
                      {inviteLink && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              background: "#111",
                              border: "1px solid #1a1a1a",
                              borderRadius: "4px",
                              padding: "8px 12px",
                            }}
                          >
                            <span
                              style={{
                                flex: 1,
                                fontSize: "10px",
                                color: "#7F8C8D",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {inviteLink}
                            </span>
                            <button
                              onClick={handleCopy}
                              style={{
                                fontSize: "10px",
                                color: copied ? "#4ade80" : "#BDC3C7",
                                background: "transparent",
                                border: "1px solid #252525",
                                padding: "2px 8px",
                                borderRadius: "3px",
                                cursor: "pointer",
                                fontFamily: "var(--font-jetbrains-mono)",
                                flexShrink: 0,
                              }}
                            >
                              {copied ? "copied!" : "copy()"}
                            </button>
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "rgba(127,140,141,0.5)",
                              marginTop: "6px",
                            }}
                          >
                            // expires in 24h · single use
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Members list */}
                  {project?.members?.map((member: any) => (
                    <div
                      key={member.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 20px",
                        borderBottom: "1px solid rgba(26,26,26,0.5)",
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#1a1a1a",
                          border: "1px solid #252525",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#BDC3C7",
                          flexShrink: 0,
                        }}
                      >
                        {member?.user?.name?.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#ECF0F1",
                            marginBottom: "2px",
                          }}
                        >
                          {member?.user?.name}
                        </div>
                        <div style={{ fontSize: "10px", color: "#7F8C8D" }}>
                          {member?.user?.email}
                        </div>
                      </div>

                      {/* Online dot */}
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#252525",
                          flexShrink: 0,
                        }}
                      ></div>

                      {/* Role — static for owner, dropdown + remove for others */}
                      {member.role === "OWNER" ? (
                        <div
                          style={{
                            fontSize: "9px",
                            padding: "2px 8px",
                            borderRadius: "3px",
                            background: "rgba(189,195,199,0.1)",
                            color: "#BDC3C7",
                          }}
                        >
                          OWNER
                        </div>
                      ) : myRole === "OWNER" ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value)
                            }
                            style={{
                              background: "#111",
                              border: "1px solid #252525",
                              borderRadius: "3px",
                              color: "#7F8C8D",
                              fontSize: "10px",
                              padding: "2px 6px",
                              fontFamily: "var(--font-jetbrains-mono)",
                              cursor: "pointer",
                            }}
                          >
                            <option value="EDITOR">EDITOR</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            style={{
                              background: "rgba(248,113,113,0.1)",
                              color: "#f87171",
                              border: "1px solid rgba(248,113,113,0.3)",
                              padding: "2px 8px",
                              borderRadius: "3px",
                              fontSize: "10px",
                              cursor: "pointer",
                              fontFamily: "var(--font-jetbrains-mono)",
                            }}
                          >
                            remove()
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: "9px",
                            padding: "2px 8px",
                            borderRadius: "3px",
                            background:
                              member.role === "EDITOR"
                                ? "rgba(96,165,250,0.1)"
                                : "rgba(127,140,141,0.15)",
                            color:
                              member.role === "EDITOR" ? "#60a5fa" : "#7F8C8D",
                          }}
                        >
                          {member.role}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activePannel === "settings" && (
              <>
                <div
                  className={style.sectionHeader}
                  style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                >
                  <div className={style.sectionTitle}>settings</div>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#7F8C8D",
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}
                  >
                    // owner only
                  </span>
                </div>

                {myRole !== "OWNER" ? (
                  <div
                    className={style.panel}
                    style={{
                      padding: "24px 20px",
                      fontFamily: "var(--font-jetbrains-mono)",
                      fontSize: "11px",
                      color: "#7F8C8D",
                    }}
                  >
                    // access_denied() — only project owners can modify settings
                  </div>
                ) : (
                  <>
                    {/* Link to GitHub */}
                    {!project?.githubFullName && (
                      <div
                        className={style.panel}
                        style={{ marginBottom: "16px" }}
                      >
                        <div className={style.panelHeader}>
                          <div className={style.panelTitle}>github_sync</div>
                        </div>
                        <div
                          style={{
                            padding: "16px 20px",
                            fontFamily: "var(--font-jetbrains-mono)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#7F8C8D",
                              marginBottom: "12px",
                            }}
                          >
                            // link_to_github() — creates a private repo and
                            syncs your current files
                          </div>
                          <button
                            onClick={async () => {
                              const res = await fetch(
                                `/api/projects/${projectId}/github/link`,
                                { method: "POST" },
                              );
                              const data = await res.json();
                              if (res.ok) {
                                refreshProject();
                              } else {
                                alert(data?.error || "Failed to link GitHub");
                              }
                            }}
                            style={{
                              background: "#BDC3C7",
                              color: "#000",
                              border: "none",
                              padding: "6px 16px",
                              borderRadius: "3px",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontFamily: "var(--font-jetbrains-mono)",
                            }}
                          >
                            link_to_github()
                          </button>
                        </div>
                      </div>
                    )}

                    {project?.githubFullName && (
                      <div
                        className={style.panel}
                        style={{ marginBottom: "16px" }}
                      >
                        <div className={style.panelHeader}>
                          <div className={style.panelTitle}>github_sync</div>
                        </div>
                        <div
                          style={{
                            padding: "16px 20px",
                            fontFamily: "var(--font-jetbrains-mono)",
                            fontSize: "11px",
                            color: "#4ade80",
                          }}
                        >
                          ✓ linked to{" "}
                          <a
                            href={`https://github.com/${project.githubFullName}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#60a5fa" }}
                          >
                            {project.githubFullName}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Change Status */}
                    <div
                      className={style.panel}
                      style={{ marginBottom: "16px" }}
                    >
                      <div className={style.panelHeader}>
                        <div className={style.panelTitle}>project_status</div>
                      </div>
                      <div
                        style={{
                          padding: "16px 20px",
                          fontFamily: "var(--font-jetbrains-mono)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#7F8C8D",
                            marginBottom: "12px",
                          }}
                        >
                          // set_status()
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <select
                            value={projectStatus}
                            onChange={(e) => setProjectStatus(e.target.value)}
                            style={{
                              background: "#111",
                              border: "1px solid #252525",
                              borderRadius: "3px",
                              color: "#ECF0F1",
                              fontSize: "11px",
                              padding: "6px 10px",
                              fontFamily: "var(--font-jetbrains-mono)",
                              cursor: "pointer",
                              outline: "none",
                            }}
                          >
                            <option value="active">active</option>
                            <option value="archived">archived</option>
                            <option value="completed">completed</option>
                          </select>
                          <button
                            onClick={handleStatusChange}
                            disabled={statusSaving}
                            style={{
                              background: "#BDC3C7",
                              color: "#000",
                              border: "none",
                              padding: "6px 16px",
                              borderRadius: "3px",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontFamily: "var(--font-jetbrains-mono)",
                            }}
                          >
                            {statusSaving ? "saving..." : "save_status()"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div
                      className={style.panel}
                      style={{ border: "1px solid rgba(248,113,113,0.2)" }}
                    >
                      <div
                        className={style.panelHeader}
                        style={{
                          borderBottom: "1px solid rgba(248,113,113,0.15)",
                        }}
                      >
                        <div
                          className={style.panelTitle}
                          style={{ color: "#f87171" }}
                        >
                          danger_zone
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "16px 20px",
                          fontFamily: "var(--font-jetbrains-mono)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#7F8C8D",
                            marginBottom: "12px",
                          }}
                        >
                          // delete_project() — this action is irreversible.
                          type project name to confirm.
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#ECF0F1",
                            marginBottom: "10px",
                          }}
                        >
                          Project name:{" "}
                          <span style={{ color: "#f87171" }}>
                            {project?.name}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="type project name to confirm"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            style={{
                              background: "#111",
                              border: "1px solid rgba(248,113,113,0.3)",
                              borderRadius: "3px",
                              color: "#ECF0F1",
                              fontSize: "11px",
                              padding: "6px 12px",
                              fontFamily: "var(--font-jetbrains-mono)",
                              outline: "none",
                              width: "240px",
                            }}
                          />
                          <button
                            onClick={handleDeleteProject}
                            disabled={
                              deleteConfirm !== project?.name || isDeleting
                            }
                            style={{
                              background:
                                deleteConfirm === project?.name
                                  ? "rgba(248,113,113,0.15)"
                                  : "transparent",
                              color:
                                deleteConfirm === project?.name
                                  ? "#f87171"
                                  : "#7F8C8D",
                              border: `1px solid ${deleteConfirm === project?.name ? "rgba(248,113,113,0.4)" : "#252525"}`,
                              padding: "6px 16px",
                              borderRadius: "3px",
                              fontSize: "11px",
                              cursor:
                                deleteConfirm === project?.name
                                  ? "pointer"
                                  : "not-allowed",
                              fontFamily: "var(--font-jetbrains-mono)",
                              transition: "all 0.2s",
                            }}
                          >
                            {isDeleting ? "deleting..." : "delete_project()"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </main>
          {/* Mobile bottom nav island */}
          <div className={style.mobileNavIsland}>
            <button
              onClick={() => setActivePanel("projectDashboard")}
              className={`${style.mobileNavItem} ${activePannel === "projectDashboard" ? style.mobileNavItemActive : ""}`}
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
              onClick={() => setActivePanel("collaborators")}
              className={`${style.mobileNavItem} ${activePannel === "collaborators" ? style.mobileNavItemActive : ""}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {totalmembers > 0 && (
                <span className={style.mobileNavBadge}>{totalmembers}</span>
              )}
            </button>

            {myRole === "OWNER" && (
              <button
                onClick={() => setActivePanel("settings")}
                className={`${style.mobileNavItem} ${activePannel === "settings" ? style.mobileNavItemActive : ""}`}
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* FAB — open_in_ide(), sibling of the island so the mask doesn't clip it */}
          <button
            onClick={() => router.push(`/editor/${projectId}`)}
            className={style.mobileNavFab}
            aria-label="open in ide"
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
                d="M8 9l-3 3 3 3m8-6l3 3-3 3m-6 3l4-12"
              />
            </svg>
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
          <div className={`${style.statusItem}`}>
            <span>{project?.name}</span>
          </div>
          <div className={`${style.statusItem}`}>TypeScript</div>
          <div className={`${style.statusItem} ml-auto`}>
            COLLAB_IDE_DASHBOARD_V1.0
          </div>
        </div>
      </div>
    </div>
  );
}
