import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Artifact } from '../types';
import { parseHtmlForPreview } from '../utils/parser';
import { translations, Language } from '../utils/translations';

interface PreviewCardProps {
  artifact: Artifact;
  index: number;
  useNumbering: boolean;
  onDownloadStart: () => void;
  onDownloadEnd: () => void;
  onRegister: (id: string, fn: () => Promise<{ name: string, dataUrl: string } | null>) => void;
  onUnregister: (id: string) => void;
  lang: Language;
}

const PreviewCard: React.FC<PreviewCardProps> = ({
  artifact,
  index,
  useNumbering,
  onDownloadStart,
  onDownloadEnd,
  onRegister,
  onUnregister,
  lang
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  const [parsed, setParsed] = useState<{ styles: string; bodyContent: string }>({ styles: '', bodyContent: '' });
  const wrapperId = `preview-${artifact.id}`;

  const t = translations[lang].previewCard;

  useEffect(() => {
    const { styles, bodyContent } = parseHtmlForPreview(artifact.code, wrapperId);
    setParsed({ styles, bodyContent });
  }, [artifact.code, wrapperId]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.offsetWidth;
        const designWidth = 1080;
        const newScale = Math.min(availableWidth / designWidth, 1);
        setScale(newScale - 0.05);
      }
    };

    const timer = setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      clearTimeout(timer);
    };
  }, [parsed]);

  const getFullHtml = () => {
    const code = artifact.code.trim();
    if (code.match(/^\s*<!DOCTYPE/i) || code.match(/^\s*<html/i)) {
      return code;
    }

    return `<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8">\n<title>${artifact.title}</title>\n</head>\n<body style="margin:0;padding:0;background:#fff;">\n${artifact.code}\n</body>\n</html>`;
  };

  const generateImage = useCallback(async (): Promise<{ name: string, dataUrl: string } | null> => {
    const fullHtml = getFullHtml();
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      zIndex: '-9999',
      visibility: 'visible',
      border: 'none',
      backgroundColor: '#ffffff',
      width: '1920px',
      height: '1080px'
    });

    document.body.appendChild(iframe);

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) throw new Error("Could not access iframe document");

      doc.open();
      doc.write(fullHtml);
      doc.close();

      await new Promise<void>((resolve) => {
        iframe.onload = () => {
          if ((doc as any).fonts) {
            (doc as any).fonts.ready.then(() => setTimeout(resolve, 500));
          } else {
            setTimeout(resolve, 1000);
          }
        };
        setTimeout(resolve, 3000);
      });

      const body = doc.body;
      const html = doc.documentElement;
      body.style.margin = '0';
      body.style.padding = '0';
      html.style.margin = '0';
      html.style.padding = '0';

      const fullHeight = Math.max(body.scrollHeight, body.offsetHeight, html.scrollHeight, html.offsetHeight);
      iframe.style.height = `${fullHeight + 100}px`;

      let targetNode: HTMLElement = body;
      const visualChildren = Array.from(body.children).filter(el =>
        !['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE'].includes(el.tagName) &&
        el.nodeType === 1
      );

      if (visualChildren.length === 1) {
        targetNode = visualChildren[0] as HTMLElement;
      } else {
        body.style.width = 'fit-content';
        body.style.height = 'fit-content';
        body.style.display = 'inline-block';
      }

      const rect = targetNode.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : 1920;
      const height = rect.height > 0 ? rect.height : fullHeight;

      const w = window as any;
      const canvas = await w.html2canvas(targetNode, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: width,
        height: height,
        windowWidth: width,
        windowHeight: height,
        logging: false,
        imageTimeout: 5000,
        removeContainer: true
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      const safeTitle = artifact.title.replace(/[\\/:*?"<>|]/g, '_').trim() || 'image';

      return { name: safeTitle, dataUrl };
    } catch (err) {
      console.error("Image generation failed:", err);
      return null;
    } finally {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }
  }, [artifact.title, artifact.code]);

  const handleHtmlDownload = () => {
    const prefix = useNumbering ? `${String(index + 1).padStart(2, '0')}_` : '';
    const safeTitle = artifact.title.replace(/[\\/:*?"<>|]/g, '_').trim() || 'design';
    const fullHtml = getFullHtml();

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    onRegister(artifact.id, generateImage);
    return () => onUnregister(artifact.id);
  }, [artifact.id, generateImage, onRegister, onUnregister]);

  const handleManualDownloadClick = async () => {
    onDownloadStart();
    const result = await generateImage();
    if (result) {
      const prefix = useNumbering ? `${String(index + 1).padStart(2, '0')}_` : '';
      const link = document.createElement('a');
      link.download = `${prefix}${result.name}.jpg`;
      link.href = result.dataUrl;
      link.click();
    } else {
      alert(t.failed);
    }
    onDownloadEnd();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex-shrink-0 w-6 h-6 rounded bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="font-semibold text-gray-700 text-sm truncate max-w-[150px]" title={artifact.title}>
            {artifact.title}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleHtmlDownload}
            className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5"
          >
            <i className="fa-brands fa-html5 text-orange-600"></i> {t.htmlBtn}
          </button>
          <button
            onClick={handleManualDownloadClick}
            className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5"
          >
            <i className="fa-solid fa-download text-brand-600"></i> {t.jpgBtn}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 bg-gray-100 overflow-hidden flex items-center justify-center min-h-[300px]"
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            width: '1080px',
            height: '1080px',
          }}
          className="flex-shrink-0 bg-white shadow-xl flex items-center justify-center"
        >
          <style>{parsed.styles}</style>
          <div
            id={wrapperId}
            className="w-full h-full overflow-hidden"
            dangerouslySetInnerHTML={{ __html: parsed.bodyContent }}
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;