export interface Artifact {
  id: string;
  code: string;
  title: string;
  type: 'html' | 'unknown';
}

export interface ProcessingState {
  status: 'idle' | 'analyzing' | 'generating' | 'rendering' | 'complete' | 'error';
  message?: string;
}

export interface ParsedHtml {
  styles: string;
  bodyContent: string;
}
