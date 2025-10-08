import { Editor } from '@monaco-editor/react';
import { useTheme } from './ThemeContext';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  height?: string;
}

export default function CodeEditor({ value, onChange, onRun, onReset, height = "calc(100% - 74px)" }: Props) {
  const { theme } = useTheme();

  function handleEditorChange(val: string | undefined) {
    onChange(val ?? "");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
    }
  }

  return (
    <div className="code-editor-container" onKeyDown={handleKeyDown}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        value={value}
        onChange={handleEditorChange}
        options={{
          fontSize: 14,
          minimap: { enabled: true, scale: 1 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          folding: true,
          bracketMatching: 'always',
          autoIndent: 'full',
          padding: { top: 10, bottom: 10 },
          renderWhitespace: 'selection',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
        }}
      />
    </div>
  );
}
