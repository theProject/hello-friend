// src/app/api/generate-image/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const response = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT_NAME}/images/generations?api-version=2024-02-01`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY!,
        },
        body: JSON.stringify({
          prompt,
          n: 1,
          size: "1792x1024",
          quality: "hd",
          style: "vivid"
        }),
      }
    );

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      console.error('Azure OpenAI API error details:', errorData);
      return NextResponse.json(
        { error: 'Azure OpenAI API error', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ imageUrl: data.data[0].url });

  } catch (error: unknown) {
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error generating image:', error.message, error.stack);
    } else {
      console.error('Error generating image:', error);
    }

    return NextResponse.json(
      { error: 'Failed to generate image', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'GET method not allowed on this endpoint. Use POST instead.' },
    { status: 405 }
  );
}
