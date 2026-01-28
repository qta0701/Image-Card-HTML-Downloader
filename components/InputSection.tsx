import React, { useState, useCallback, useRef, useEffect } from 'react';
import { translations, Language } from '../utils/translations';

interface InputSectionProps {
  onProcess: (text: string) => void;
  isLoading: boolean;
  lang: Language;
}

const InputSection: React.FC<InputSectionProps> = ({ onProcess, isLoading, lang }) => {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const t = translations[lang].inputSection;

  // Refs to manage auto-submit logic and prevent double submissions
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedTextRef = useRef<string>('');
  const isFileUploadRef = useRef<boolean>(false);

  // Auto-process effect for manual text entry (Debounce 1s)
  useEffect(() => {
    // If empty or currently loading, do nothing
    if (!text.trim() || isLoading) return;

    // If this text update was triggered by a file upload, 
    // it's handled immediately in processFiles, so we skip the debounce here.
    if (isFileUploadRef.current) {
      isFileUploadRef.current = false; // Reset flag
      return;
    }

    // Don't re-process if it's the exact same text we just processed
    if (text === lastProcessedTextRef.current) return;

    const timer = setTimeout(() => {
      console.log("Auto-processing text input...");
      lastProcessedTextRef.current = text;
      onProcess(text);
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [text, onProcess, isLoading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // Explicitly cast to File[] to handle iterator
    const files = Array.from(e.dataTransfer.files) as File[];
    processFiles(files);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(f =>
      f.type === 'text/plain' ||
      f.type === 'text/html' ||
      f.name.match(/\.(tsx|ts|md|txt|js|css|htm|html)$/i)
    );

    if (validFiles.length === 0) return;

    try {
      // Read all files asynchronously
      const fileContents = await Promise.all(validFiles.map(file => {
        return new Promise<{ name: string, content: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              name: file.name,
              content: event.target?.result as string || ''
            });
          };
          reader.readAsText(file);
        });
      }));

      // Combine contents. 
      const combinedText = fileContents.map(({ name, content }) => {
        if (name.match(/\.(html|htm)$/i) || content.trim().match(/^<[a-z!]/i)) {
          return `\`\`\`html\n<!-- Source: ${name} -->\n${content}\n\`\`\``;
        }
        return content;
      }).join('\n\n');

      // Set flag so useEffect doesn't double-fire
      isFileUploadRef.current = true;

      setText(combinedText);

      if (validFiles.length === 1) {
        setFileName(validFiles[0].name);
      } else {
        setFileName(`${validFiles.length} ${t.filesLoaded}`);
      }

      // IMMEDIATE EXECUTION for files
      if (combinedText.trim() !== lastProcessedTextRef.current) {
        console.log("File loaded. Processing immediately.");
        lastProcessedTextRef.current = combinedText;
        onProcess(combinedText);
      }

    } catch (error) {
      console.error("Error reading files:", error);
      alert("Failed to read some files.");
    }
  };

  const handleClear = () => {
    setText('');
    setFileName(null);
    lastProcessedTextRef.current = ''; // Reset memory so same text can be processed again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <i className="fa-solid fa-code text-brand-500"></i>
          {t.title}
        </h2>

        {/* Clear / Initialize Button */}
        {(text || fileName) && (
          <button
            onClick={handleClear}
            className="text-xs bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 px-3 py-1.5 rounded-md transition-all shadow-sm flex items-center gap-2"
            title="Reset all inputs"
          >
            <i className="fa-solid fa-rotate-left"></i> {t.reset}
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden min-h-0">
        {/* Drag & Drop Zone - Compact */}
        <div
          className={`flex-shrink-0 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group
            ${isDragging
              ? 'border-brand-500 bg-brand-50 scale-[1.01]'
              : fileName
                ? 'border-brand-200 bg-brand-50/30'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".txt,.html,.htm,.md,.tsx,.ts,.js,.css"
            multiple // Enable multiple file selection
          />
          <div className="text-center pointer-events-none p-2 w-full flex items-center justify-center gap-3">
            {fileName ? (
              <>
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                  <i className="fa-solid fa-file-code"></i>
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-semibold text-brand-700 truncate max-w-[200px]">{fileName}</p>
                  <p className="text-[10px] text-brand-500">{t.autoProcessing}</p>
                </div>
              </>
            ) : (
              <>
                <i className={`fa-solid fa-file-import text-xl transition-colors ${isDragging ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-500'}`}></i>
                <span className="text-sm font-medium text-gray-600">
                  {isDragging ? t.dropFiles : t.dragOrClick}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Large Input Window - Max Height */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.placeholder}
            className="w-full h-full resize-none p-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 focus:ring-2 focus:ring-brand-500 focus:outline-none focus:bg-white transition-all font-mono text-sm leading-relaxed custom-scrollbar shadow-inner"
            spellCheck={false}
          />
          {/* Floating badge for line count if text exists */}
          {text && (
            <div className="absolute bottom-3 right-3 bg-gray-100/80 backdrop-blur text-gray-400 text-[10px] px-2 py-1 rounded border border-gray-200 pointer-events-none flex items-center gap-2">
              {isLoading && <i className="fa-solid fa-circle-notch fa-spin text-brand-500"></i>}
              <span>{text.split('\n').length} lines</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
        <button
          onClick={() => {
            lastProcessedTextRef.current = text; // Update ref to avoid double fire
            onProcess(text);
          }}
          disabled={!text.trim() || isLoading}
          className={`px-6 py-3 rounded-lg font-bold text-white shadow-md transition-all flex items-center gap-2 relative z-10 w-full justify-center sm:w-auto
            ${!text.trim() || isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 hover:shadow-lg active:scale-95'}`}
        >
          {isLoading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i> {t.processing}
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles"></i> {t.generateNow}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;