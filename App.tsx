import React, { useState, useRef } from 'react';
import InputSection from './components/InputSection';
import PreviewCard from './components/PreviewCard';
import GuideModal from './components/GuideModal';
import { extractArtifacts } from './utils/parser';
import { Artifact, ProcessingState } from './types';
import { translations, Language } from './utils/translations';

const App: React.FC = () => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [procState, setProcState] = useState<ProcessingState>({ status: 'idle' });
  const [isDownloading, setIsDownloading] = useState(false);
  const [useNumbering, setUseNumbering] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const t = translations[lang];

  // Registry for child components' download functions
  const downloadHandlers = useRef<Map<string, () => Promise<{ name: string, dataUrl: string } | null>>>(new Map());

  const registerDownloadHandler = (id: string, fn: () => Promise<{ name: string, dataUrl: string } | null>) => {
    downloadHandlers.current.set(id, fn);
  };

  const unregisterDownloadHandler = (id: string) => {
    downloadHandlers.current.delete(id);
  };

  const processInput = async (inputText: string) => {
    setProcState({ status: 'analyzing' });
    setArtifacts([]);
    downloadHandlers.current.clear();

    try {
      // Short delay to allow UI to update to 'analyzing' state before heavy parsing if text is huge
      await new Promise(resolve => setTimeout(resolve, 100));

      const extracted = extractArtifacts(inputText);

      if (extracted.length === 0) {
        setProcState({ status: 'error', message: 'No valid HTML/CSS content found in the input.' });
        return;
      }

      setArtifacts(extracted);
      setProcState({ status: 'complete' });

    } catch (error) {
      console.error(error);
      setProcState({ status: 'error', message: 'An error occurred during processing.' });
    }
  };

  const handleDownloadAllImages = async () => {
    if (artifacts.length === 0) return;

    setIsDownloading(true);
    try {
      let count = 0;

      for (let i = 0; i < artifacts.length; i++) {
        const artifact = artifacts[i];
        const handler = downloadHandlers.current.get(artifact.id);
        if (handler) {
          const result = await handler();
          if (result) {
            const prefix = useNumbering ? `${String(i + 1).padStart(2, '0')}_` : '';
            const link = document.createElement('a');
            link.download = `${prefix}${result.name}.jpg`;
            link.href = result.dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            count++;
          }
          await new Promise(r => setTimeout(r, 800));
        }
      }

      if (count === 0) alert("No images were successfully generated.");
    } catch (e) {
      console.error("Batch download error", e);
      alert("An error occurred during batch download.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAllHtml = async () => {
    if (artifacts.length === 0) return;
    setIsDownloading(true);

    try {
      for (let i = 0; i < artifacts.length; i++) {
        const artifact = artifacts[i];
        const prefix = useNumbering ? `${String(i + 1).padStart(2, '0')}_` : '';
        const safeTitle = artifact.title.replace(/[\\/:*?"<>|]/g, '_').trim() || 'design';
        const code = artifact.code.trim();

        let fullHtml = code;
        if (!code.match(/^\s*<!DOCTYPE/i) && !code.match(/^\s*<html/i)) {
          fullHtml = `<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8">\n<title>${artifact.title}</title>\n</head>\n<body style="margin:0;padding:0;">\n${code}\n</body>\n</html>`;
        }

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${prefix}${safeTitle}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        await new Promise(r => setTimeout(r, 300));
      }
    } catch (e) {
      console.error("Batch HTML download error", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between shrink-0 z-10 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <i className="fa-solid fa-code text-xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight truncate">
                {t.title}
              </h1>
              <button
                onClick={() => setIsGuideOpen(true)}
                className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 hover:shadow-md transition-all flex-shrink-0 flex items-center gap-2 font-semibold"
              >
                <i className="fa-regular fa-circle-question"></i>
                {t.howToUse}
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">
              {t.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg flex-shrink-0">
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            English
          </button>
          <button
            onClick={() => setLang('ko')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${lang === 'ko' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            한국어
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-1/3 min-w-[350px] max-w-[500px] p-4 flex flex-col h-full border-r border-gray-200 bg-white z-0">
          <InputSection
            onProcess={processInput}
            isLoading={procState.status === 'analyzing' || procState.status === 'generating'}
            lang={lang}
          />
          {procState.status === 'error' && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex items-start gap-2">
              <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
              <span>{procState.message}</span>
            </div>
          )}
        </div>

        <div className="flex-1 bg-slate-100 overflow-y-auto p-8 relative">
          {procState.status === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <i className="fa-solid fa-file-code text-6xl mb-4 opacity-30"></i>
              <p className="text-lg">{t.inputSection.placeholder}</p>
            </div>
          )}

          {(procState.status === 'analyzing' || procState.status === 'generating') && (
            <div className="h-full flex flex-col items-center justify-center text-brand-600">
              <i className="fa-solid fa-circle-notch fa-spin text-5xl mb-6"></i>
              <p className="text-xl font-medium animate-pulse">{procState.message || t.inputSection.processing}</p>
            </div>
          )}

          {artifacts.length > 0 && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6 sticky top-0 z-20 bg-slate-100/90 backdrop-blur-sm py-4 border-b border-transparent">
                <h2 className="text-2xl font-bold text-slate-800">
                  {t.resultsSection.title} <span className="text-slate-400 text-lg font-normal">({artifacts.length})</span>
                </h2>
                <div className="flex items-center gap-4">
                  {/* Numbering Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={useNumbering}
                      onChange={(e) => setUseNumbering(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-600 select-none">{t.resultsSection.includeNumbering}</span>
                  </label>

                  <button
                    onClick={handleDownloadAllHtml}
                    disabled={isDownloading}
                    className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
                  >
                    <i className="fa-brands fa-html5 text-orange-600"></i>
                    {t.resultsSection.downloadAllHtml}
                  </button>
                  <button
                    onClick={handleDownloadAllImages}
                    disabled={isDownloading}
                    className="bg-slate-800 text-white hover:bg-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
                  >
                    {isDownloading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-images"></i>}
                    {t.resultsSection.downloadAllImages}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                {artifacts.map((artifact, index) => (
                  <PreviewCard
                    key={artifact.id}
                    artifact={artifact}
                    index={index}
                    useNumbering={useNumbering}
                    onDownloadStart={() => setIsDownloading(true)}
                    onDownloadEnd={() => setIsDownloading(false)}
                    onRegister={registerDownloadHandler}
                    onUnregister={unregisterDownloadHandler}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {isDownloading && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <span className="font-medium">{t.resultsSection.downloading}</span>
        </div>
      )}

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        language={lang}
      />
    </div>
  );
};

export default App;