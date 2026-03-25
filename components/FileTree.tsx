"use client"

export interface FileNode {
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
        name: "src",
        type: "folder",
        children: [
            {
                name: "index.tsx",
                type: "file"
            },
            {
                name: "App.tsx",
                type: "file"
            },
            {
                name: "components",
                type: "folder",
                children: [
                    {
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