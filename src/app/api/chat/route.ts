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
    fileName?: string;
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

    // Search for relevant memories AND documents
    const relevantMemories = await searchMemories(message, 5);
    
    // Get recent conversation context
    const recentConversation = await getRecentConversation(5);

    // Prepare conversation context
    const conversationHistory: Message[] = recentConversation
      .reverse()
      .map((msg) => ({
        role: (msg.type === 'message' ? 'user' : 'assistant') as MessageRole,
        content: msg.content
      }));

    // Separate documents from general memories for better context organization
    const documents = relevantMemories.filter(mem => mem.type === 'document');
    const memories = relevantMemories.filter(mem => mem.type === 'message');

    // Create contextualized memory strings
    const memoryContext = memories.length > 0 
      ? "Related memories:\n" + memories
          .map((mem: Memory) => `- ${mem.content} (${new Date(mem.timestamp).toLocaleDateString()})`)
          .join('\n')
      : "";

    const documentContext = documents.length > 0
      ? "\nRelevant documents:\n" + documents
          .map((doc: Memory) => 
            `Document: ${doc.metadata?.fileName || 'Unnamed'}\nContent: ${doc.content}`
          )
          .join('\n\n')
      : "";

    // System message to define assistant's behavior
    const systemMessage: Message = {
      role: 'system',
      content: `You are a highly intelligent personal assistant with perfect memory recall. 
                When referencing documents, always mention them by name and quote specific relevant passages.

                Current Context:
                ${memoryContext}

                Available Documents:
                ${documentContext}

                Instructions:
                1. If asked about documents, refer to them by name and quote relevant parts
                2. When answering questions, use specific information from the documents when available
                3. If you can't find specific information in the documents, say so
                4. Maintain a friendly, professional tone`
    };

    // Get response from Azure OpenAI
    const assistantResponse = await getAzureOpenAIResponse([
      systemMessage,
      ...conversationHistory,
      { role: 'user', content: message }
    ]);

    // Store assistant's response
    await storeMemory(assistantResponse, 'message');

    return NextResponse.json({ response: assistantResponse });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}