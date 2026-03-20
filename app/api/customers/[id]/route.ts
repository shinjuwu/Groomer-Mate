import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { verifyLiffToken, authErrorResponse } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await verifyLiffToken(req);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (data.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await verifyLiffToken(req);
    const supabase = getServiceSupabase();

    // Ownership check
    const { data: existing } = await supabase
      .from('customers')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const field of ['name', 'phone', 'line_id', 'notes'] as const) {
      if (field in body) {
        updates[field] = body[field] || null;
      }
    }

    if ('name' in body && !body.name?.trim()) {
      return NextResponse.json({ error: '客戶姓名為必填' }, { status: 400 });
    }
    if ('name' in body) {
      updates.name = body.name.trim();
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await verifyLiffToken(req);
    const supabase = getServiceSupabase();

    const { data: existing } = await supabase
      .from('customers')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
