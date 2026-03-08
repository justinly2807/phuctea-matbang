import { NextResponse } from 'next/server';
import { supabase, TABLE_EVALUATIONS } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from(TABLE_EVALUATIONS)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
