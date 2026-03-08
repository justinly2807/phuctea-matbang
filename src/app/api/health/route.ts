import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return NextResponse.json({
    url_preview: url.substring(0, 40) + '...',
    key_length: key.length,
    key_end: '...' + key.substring(key.length - 10),
  });
}
