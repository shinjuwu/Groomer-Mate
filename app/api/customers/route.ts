import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { verifyLiffToken, authErrorResponse } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { userId } = await verifyLiffToken(req);
    const body = await req.json();
    const { name, phone, line_id, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: '客戶姓名為必填' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: userId,
        name: name.trim(),
        phone: phone || null,
        line_id: line_id || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await verifyLiffToken(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const supabase = getServiceSupabase();

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (search?.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], total: count || 0 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
