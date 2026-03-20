
import  Editor  from "@monaco-editor/react";

interface EditorProps {
    language: string;
    value: string;
}

const EditorComponent: React.FC<EditorProps> = ({ language, value }) => {
    return (
        <Editor
            height="100%"
            theme="vs-dark"
            defaultLanguage={language}
            defaultValue={value}
        />
    );
};

export default EditorComponent;