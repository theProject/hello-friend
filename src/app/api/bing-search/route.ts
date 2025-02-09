// src/app/api/bing-search/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({
    message: "Bing Search API endpoint stub. Not implemented yet.",
  });
}