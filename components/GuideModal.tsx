import React, { useEffect, useState } from 'react';
import { Language } from '../utils/translations';

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
}

const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, language }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const content = {
        en: {
            title: "How to Use & Examples",
            stepsTitle: "How to Use",
            steps: [
                "Paste your HTML/CSS code directly into the large input area.",
                "Or drag & drop .html, .txt, or code files to upload them.",
                "The preview will be generated automatically after 1 second.",
                "Click 'Download All HTML' to save the code locally.",
                "Click 'Download All Images' to save high-quality JPG screenshots."
            ],
            casesTitle: "Use Cases",
            cases: [
                { title: "Reviewing Design Mockups", desc: "Quickly visualize HTML code snippets from ChatGPT or Claude." },
                { title: "Saving Inspiration", desc: "Save code examples as images for your design mood board." },
                { title: "Documentation", desc: "Generate clean screenshots of UI components for documentation." }
            ],
            close: "Close"
        },
        ko: {
            title: "사용 방법 및 활용 사례",
            stepsTitle: "사용 방법",
            steps: [
                "HTML/CSS 코드를 입력창에 직접 붙여넣으세요.",
                "또는 .html, .txt, 코드 파일을 드래그 앤 드롭하여 업로드하세요.",
                "입력 후 1초 뒤에 자동으로 미리보기가 생성됩니다.",
                "'전체 HTML 다운로드'를 클릭하여 코드를 파일로 저장하세요.",
                "'전체 이미지 다운로드'를 클릭하여 고화질 JPG 스크린샷을 저장하세요."
            ],
            casesTitle: "활용 사례",
            cases: [
                { title: "디자인 시안 검토", desc: "ChatGPT나 Claude가 작성한 HTML 코드를 즉시 시각화하여 확인." },
                { title: "레퍼런스 저장", desc: "코드로 된 디자인 예시를 이미지로 변환하여 무드보드에 저장." },
                { title: "문서화 작업", desc: "UI 컴포넌트의 깔끔한 스크린샷을 생성하여 기획서나 문서에 첨부." }
            ],
            close: "닫기"
        }
    };

    const t = content[language];

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div
                className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <i className="fa-regular fa-circle-question text-brand-600"></i>
                            {t.title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Steps Section */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-700 mb-4 border-l-4 border-brand-500 pl-3">
                                {t.stepsTitle}
                            </h3>
                            <ul className="space-y-3">
                                {t.steps.map((step, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <span className="flex-shrink-0 w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xs font-bold font-mono">
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm leading-relaxed mt-0.5">{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Use Cases Section */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-700 mb-4 border-l-4 border-indigo-500 pl-3">
                                {t.casesTitle}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {t.cases.map((useCase, idx) => (
                                    <div key={idx} className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                                        <h4 className="font-semibold text-indigo-900 mb-1 text-sm">
                                            <i className="fa-solid fa-check text-indigo-500 mr-2"></i>
                                            {useCase.title}
                                        </h4>
                                        <p className="text-xs text-indigo-600 pl-6 leading-relaxed opacity-80">
                                            {useCase.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-gray-800 text-white hover:bg-gray-700 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-gray-200"
                        >
                            {t.close}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideModal;
