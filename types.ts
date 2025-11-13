// types.ts
export interface Source {
  file: string;
  location: string;
  quote: string;
}

export type Confidence = 'low' | 'medium' | 'high';

export interface ApiResponse {
  answer: string;
  explanation: string;
  sources: Source[];
  confidence: Confidence;
  follow_up_questions: string[];
}

export type Model = 'copilot' | 'general' | 'fast';

export interface AppearanceSettings {
    chatBackgroundColor: 'default' | 'blue' | 'green' | 'beige';
    fontSize: 'sm' | 'base' | 'lg';
}

export interface Settings {
    model: Model;
    maxTokens: number;
    chunkSize: number;
    retrievedPassages: number;
    appearance: AppearanceSettings;
}

export type SourceType = 'file' | 'url';

export interface KnowledgeSource {
  id: string;
  type: SourceType;
  source: File | string; // File object for 'file', URL string for 'url'
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress?: number; // Optional, only for files
}


export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string | ApiResponse;
}