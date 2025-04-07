// src/types/index.d.ts
export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    namespace: string;
    created_at: string;
  }
  
  export interface Conversation {
    id: string;
    user_id: string;
    title: string;
    last_summary: string | null;
    created_at: string;
  }
  
  export interface Message {
    role: 'user' | 'assistant';
    content: string;
    type?: 'search' | 'history';
    timestamp?: string;
    tags?: string[];
  }
  
  export interface FileMeta {
    id: string;
    user_id: string;
    filename: string;
    url: string;
    content_text: string;
    tags: string[];
    created_at: string;
  }