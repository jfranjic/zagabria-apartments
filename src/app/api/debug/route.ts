import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get a single reservation to see the structure
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Failed to get debug info' }, { status: 500 });
  }
}
