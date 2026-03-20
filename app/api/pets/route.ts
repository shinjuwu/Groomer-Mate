import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { verifyLiffToken, authErrorResponse } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { userId } = await verifyLiffToken(req);
    const body = await req.json();
    const { customer_id, name, species, breed, weight_kg, birth_date, notes } = body;

    if (!customer_id || !name?.trim()) {
      return NextResponse.json(
        { error: '客戶 ID 和寵物名稱為必填' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Verify customer belongs to this user
    const { data: customer } = await supabase
      .from('customers')
      .select('user_id')
      .eq('id', customer_id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    if (customer.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('pets')
      .insert({
        customer_id,
        user_id: userId,
        name: name.trim(),
        species: species || '狗',
        breed: breed || null,
        weight_kg: weight_kg || null,
        birth_date: birth_date || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create pet' }, { status: 500 });
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
    const customerId = searchParams.get('customerId');

    const supabase = getServiceSupabase();

    let query = supabase
      .from('pets')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch pets' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], total: count || 0 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
