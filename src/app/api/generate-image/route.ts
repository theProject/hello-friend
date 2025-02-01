// src/app/api/generate-image/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const response = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT_NAME}/images/generations?api-version=2024-02-15-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY!,
        },
        body: JSON.stringify({
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          style: "natural"
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ imageUrl: data.data[0].url });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}