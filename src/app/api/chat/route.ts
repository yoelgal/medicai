import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
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

    // Prepare the request to Deepseek API
    const deepseekResponse = await fetch(
      'https://api.deepseek.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful AI assistant specialized in medical and healthcare topics. Provide accurate, informative responses while being clear that you cannot replace professional medical advice.',
            },
            {
              role: 'user',
              content: message,
            },
          ],
          stream: true,
          max_tokens: 2048,
          temperature: 0.7,
        }),
      }
    );

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('Deepseek API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get response from Deepseek API' },
        { status: deepseekResponse.status }
      );
    }

    // Create a readable stream to forward the response
    const stream = new ReadableStream({
      start(controller) {
        const reader = deepseekResponse.body?.getReader();

        if (!reader) {
          controller.error(new Error('No response body'));
          return;
        }

        function pump(): Promise<void> {
          return reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }

              // Forward the chunk to the client
              controller.enqueue(value);
              return pump();
            })
            .catch((error) => {
              console.error('Stream error:', error);
              controller.error(error);
            });
        }

        return pump();
      },
    });

    // Return the streamed response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
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
