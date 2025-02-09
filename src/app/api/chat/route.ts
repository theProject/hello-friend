import { NextResponse } from 'next/server';
import {
  storeMemory,
  updateMemoryStatus,
  searchMemories,
  getRecentConversation,
  MemoryRecord,
} from '@/utils/memory-util';

type MessageRole = 'system' | 'user' | 'assistant' | 'message';

interface Message {
  role: MessageRole;
  content: string;
}

/**
 * Check if the user message should be stored as a long‑term memory.
 * Here we simply check if it starts with one of the trigger words.
 */
function isMemoryCommand(message: string): boolean {
  const triggers = ["remember", "store", "log"];
  // Use startsWith so that regular conversation doesn't trigger storage.
  return triggers.some(trigger => message.toLowerCase().trim().startsWith(trigger));
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
        stream: false,
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

    // If the message is a memory command (e.g. "remember Miranda Shaw called out today"),
    // store it as a long‑term memory (of type "document") and return a confirmation.
    if (isMemoryCommand(message)) {
      await storeMemory(message, 'document', { confirmed: true });
      return NextResponse.json({ response: "Memory stored." });
    }

    // For regular conversation messages, proceed as before.
    // Store the user message as pending (confirmed: false)
    const pendingUserMemory = await storeMemory(message, 'message', { confirmed: false });

    // Search for relevant memories and documents using vector search.
    const relevantMemories = await searchMemories(message, 5);

    // Get recent conversation context (only confirmed messages of type "message")
    const recentConversation = await getRecentConversation(5);

    // Build conversation context from confirmed messages.
    const conversationHistory: Message[] = recentConversation
      .reverse()
      .map((msg: MemoryRecord) => ({
        role: msg.type === 'message' ? 'user' : 'assistant',
        content: msg.content,
      }));

    // Separate documents from conversation messages.
    const documents = relevantMemories.filter((mem) => mem.type === 'document');
    const memories = relevantMemories.filter((mem) => mem.type === 'message');

    // Create contextualized memory strings.
    const memoryContext =
      memories.length > 0
        ? 'Related memories:\n' +
          memories
            .map(
              (mem: MemoryRecord) =>
                `- ${mem.content} (${new Date(mem.timestamp).toLocaleDateString()})`
            )
            .join('\n')
        : '';

    const documentContext =
      documents.length > 0
        ? '\nRelevant documents:\n' +
          documents
            .map(
              (doc: MemoryRecord) =>
                `Document: ${doc.metadata?.fileName || 'Unnamed'}\nContent: ${doc.content}`
            )
            .join('\n\n')
        : '';

    // System message with instructions and context.
    const systemMessage: Message = {
      role: 'system',
      content: `You are a highly intelligent personal assistant with perfect memory recall.
When referencing documents, always mention them by name and quote specific relevant passages.

Current Context:
${memoryContext}

Available Documents:
${documentContext}

Instructions:
1. If asked about documents, refer to them by name and quote relevant parts.
2. When answering questions, use specific information from the documents when available.
3. If you can't find specific information in the documents, say so.
4. Maintain a friendly, professional tone.`,
    };

    // Get the assistant's response from Azure OpenAI.
    const assistantResponse = await getAzureOpenAIResponse([
      systemMessage,
      ...conversationHistory,
      { role: 'user', content: message },
    ]);

    // Update the pending user memory to confirmed.
    await updateMemoryStatus(pendingUserMemory.id, { confirmed: true });

    // Store the assistant's response as a confirmed memory.
    await storeMemory(assistantResponse, 'message', { confirmed: true });

    return NextResponse.json({ response: assistantResponse });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
