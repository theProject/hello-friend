// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { storeMemory, searchMemories, getRecentConversation } from '@/utils/memory-util';

type MessageRole = 'system' | 'user' | 'assistant' | 'message';

interface Message {
  role: MessageRole;
  content: string;
}

interface Memory {
  content: string;
  timestamp: Date;
  type: string;
  metadata?: {
    type: string;
    created_at: Date;
  };
}

async function getAzureOpenAIResponse(messages: Message[]): Promise<string> {
  const response = await fetch(
    `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_API_KEY!,
      },
      body: JSON.stringify({
        messages,
        max_tokens: 2000,
        temperature: 0.7,
        frequency_penalty: 0,
        presence_penalty: 0,
        top_p: 0.95,
        stream: false
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Azure OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // Store the user message
    await storeMemory(message, 'message');

    // Search for relevant memories
    const relevantMemories = await searchMemories(message, 5);
    
    // Get recent conversation context
    const recentConversation = await getRecentConversation(5);

    // Prepare conversation context with proper type conversion
    const conversationHistory: Message[] = recentConversation.map((msg) => ({
      role: msg.type === 'message' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Add relevant memories as context
    const memoryContext = relevantMemories.length > 0 
      ? "Related memories:\n" + relevantMemories
          .map((mem: Memory) => `- ${mem.content} (${new Date(mem.timestamp).toLocaleDateString()})`)
          .join('\n')
      : "";

    // System message to define assistant's behavior
    const systemMessage: Message = {
      role: 'system',
      content: `You are a highly intelligent personal assistant with perfect memory recall. 
                You have access to the following relevant memories from past conversations:
                ${memoryContext}
                
                Use these memories when relevant to provide context-aware responses.
                Always maintain a friendly, professional tone.`
    };

    // Get response from Azure OpenAI
    const assistantResponse = await getAzureOpenAIResponse([
      systemMessage,
      ...conversationHistory,
      { role: 'user' as const, content: message }
    ]);

    // Store assistant's response
    await storeMemory(assistantResponse, 'message');

    return NextResponse.json({ response: assistantResponse });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}