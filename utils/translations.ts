export type Language = 'en' | 'ko';

export const translations = {
    en: {
        title: "HTML Code -> Image Downloader",
        description: "Convert HTML/CSS code directly into downloadable HTML files and high-quality images. (HTML Viewer)",
        howToUse: "How to Use",
        language: "Language",
        inputSection: {
            title: "Input Content",
            reset: "Reset",
            dropFiles: "Drop files here",
            dragOrClick: "Drag files or Click to upload",
            placeholder: "Paste HTML code or type a prompt here. (Auto-generates after 1s)",
            processing: "Processing...",
            generateNow: "Generate Now",
            filesLoaded: "files loaded",
            autoProcessing: "Auto-processing..."
        },
        resultsSection: {
            title: "Generated Previews",
            includeNumbering: "Include File Numbering",
            downloadAllHtml: "Download All HTML",
            downloadAllImages: "Download All Images",
            downloading: "Downloading files... (Please allow multiple downloads)"
        },
        previewCard: {
            htmlBtn: "HTML",
            jpgBtn: "JPG",
            failed: "Failed to generate image."
        }
    },
    ko: {
        title: "HTML 코드 -> 이미지 다운로더",
        description: "HTML/CSS 코드를 다운로드 가능한 HTML 파일과 고해상도 이미지로 변환합니다. (HTML 미리보기, HTML 뷰어)",
        howToUse: "사용 방법",
        language: "언어",
        inputSection: {
            title: "입력 내용",
            reset: "초기화",
            dropFiles: "파일을 여기에 놓으세요",
            dragOrClick: "파일을 드래그하거나 클릭하여 업로드",
            placeholder: "HTML 코드를 붙여넣거나 프롬프트를 입력하세요. (1초 후 자동 생성)",
            processing: "처리 중...",
            generateNow: "지금 생성하기",
            filesLoaded: "개 파일 로드됨",
            autoProcessing: "자동 처리 중..."
        },
        resultsSection: {
            title: "생성된 미리보기",
            includeNumbering: "파일명 순번 포함",
            downloadAllHtml: "전체 HTML 다운로드",
            downloadAllImages: "전체 이미지 다운로드",
            downloading: "다운로드 중입니다... (여러 파일 다운로드를 허용해주세요)"
        },
        previewCard: {
            htmlBtn: "HTML",
            jpgBtn: "JPG",
            failed: "이미지 생성 실패."
        }
    }
};
