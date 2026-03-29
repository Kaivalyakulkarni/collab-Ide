"use client"

export interface FileNode {
    id : string
    name: string
    type: "file" | "folder"
    children?: FileNode[]
    content?: string // For files, we can store the content here
}

interface FileTreeProps {
    files: FileNode[]
    onFileSelect: (file: FileNode) => void
    selectedFile?: string
}

export const mockFiles: FileNode[] = [
    {
        id:"mock-root",
        name: "src",
        type: "folder",
        children: [
            {
                id:"mock-1",
                name: "index.tsx",
                type: "file"
            },
            {
                id:"mock-2",
                name: "App.tsx",
                type: "file"
            },
            {
                id:"mock-3",
                name: "components",
                type: "folder",
                children: [
                    {
                        id:"mock-4",
                        name: "Editor.tsx",
                        type: "file"
                    }
                ]
            }

        ]
    }
]


const FileTree: React.FC<FileTreeProps> = ({ files, onFileSelect, selectedFile }) => {
    console.log("selectedFile prop:", selectedFile)
    const renderTree = (nodes: FileNode[]) => {
        return nodes.map((node) => (
            <div key={node.name} style={{ marginLeft: "20px" }}>
                <div onClick={() => node.type === "file" && onFileSelect(node)}
                    style={{ // Basic styling for file/folder names
                        cursor: "pointer",
                        backgroundColor: selectedFile === node.name ? "#094771" : "transparent",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        color: selectedFile === node.name ? "white" : "inherit"
                    }}>{node.name}</div>
                {node.type === "folder" && node.children && renderTree(node.children)}
            </div>
        ));
    };

    return (
        <div>
            {renderTree(files)}
        </div>
    );
}

export default FileTree;