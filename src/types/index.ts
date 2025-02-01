// src/types/index.ts
export interface Message {
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    id: string;
    imageUrl?: string;
    imageAlt?: string;
  }
  
  export interface UploadedFile {
    name: string;
    url: string;
    id: string;
    type: string;
  }
  
  export interface FileResponse {
    name: string;
    url: string;
  }
  
  export interface ProfileInfo {
    imageUrl?: string;
    name: string;
    email?: string;
  }