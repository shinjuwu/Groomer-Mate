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
      .from('grooming_logs')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
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

    const { data: existing } = await supabase
      .from('grooming_logs')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    // Allow associating a pet after the fact
    if ('petId' in body) {
      if (body.petId) {
        const { data: pet } = await supabase
          .from('pets')
          .select('user_id')
          .eq('id', body.petId)
          .single();

        if (!pet) {
          return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
        }
        if (pet.user_id !== userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
      updates.pet_id = body.petId || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('grooming_logs')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
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
      .from('grooming_logs')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('grooming_logs')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
