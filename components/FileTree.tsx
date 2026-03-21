"use client"

export interface FileNode {
  name: string
  type: "file" | "folder"
  children?: FileNode[]
}

interface FileTreeProps {
  files: FileNode[]
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


const FileTree: React.FC<FileTreeProps> = ({ files }) => {
    const renderTree = (nodes: FileNode[]) => {
        return nodes.map((node) => (
            <div key={node.name} style={{ marginLeft: "20px" }}>
                <div>{node.name}</div>
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