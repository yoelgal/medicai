import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body - now expecting either messages array or single message for backwards compatibility
    const body = await request.json();
    let messages: ChatMessage[] = [];

    if (body.messages && Array.isArray(body.messages)) {
      // New format: array of messages for conversation history
      messages = body.messages;
    } else if (body.message && typeof body.message === 'string') {
      // Backwards compatibility: single message
      messages = [{ role: 'user', content: body.message }];
    } else {
      return NextResponse.json(
        { error: 'Either "messages" array or "message" string is required' },
        { status: 400 }
      );
    }

    // Validate messages format
    if (
      !messages.every(
        (msg) =>
          msg &&
          typeof msg === 'object' &&
          ['user', 'assistant', 'system'].includes(msg.role) &&
          typeof msg.content === 'string'
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid messages format. Each message must have role ("user", "assistant", or "system") and content (string)',
        },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Initialize OpenAI client with Deepseek's base URL
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com/v1',
    });

    // Prepare messages with system prompt if not already present
    const conversationMessages: ChatMessage[] = [];

    // Add system message if not present
    const hasSystemMessage = messages.some((msg) => msg.role === 'system');
    if (!hasSystemMessage) {
      conversationMessages.push({
        role: 'system',
        content:
          'You are a helpful AI assistant specialized in medical and healthcare topics. Provide accurate, informative responses while being clear that you cannot replace professional medical advice.',
      });
    }

    // Add all conversation messages
    conversationMessages.push(...messages);

    // Create streaming chat completion
    const stream = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: conversationMessages,
      stream: true,
      max_tokens: 100,
      temperature: 0.7,
    });

    // Create a readable stream to forward the response
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              // Encode the content as Server-Sent Events format
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            }
          }
          // Send final message to indicate completion
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    // Return the streamed response
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
