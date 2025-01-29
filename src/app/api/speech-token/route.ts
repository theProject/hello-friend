import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      `https://${process.env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const token = await response.text();

    return NextResponse.json({
      token,
      region: process.env.AZURE_SPEECH_REGION
    });
  } catch (error) {
    console.error('Error getting speech token:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}