import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { verifyLiffToken, authErrorResponse } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { userId } = await verifyLiffToken(req);
    const body = await req.json();
    const { transcription, summary, tags, internalMemo, petId, audioUrl } = body;

    const supabase = getServiceSupabase();

    // If petId provided, verify ownership
    if (petId) {
      const { data: pet } = await supabase
        .from('pets')
        .select('user_id')
        .eq('id', petId)
        .single();

      if (!pet) {
        return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
      }
      if (pet.user_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { data, error } = await supabase
      .from('grooming_logs')
      .insert({
        user_id: userId,
        pet_id: petId || null,
        audio_url: audioUrl || null,
        transcription: transcription || null,
        summary: summary || null,
        tags: tags || null,
        internal_memo: internalMemo || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save record' }, { status: 500 });
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
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
    const offset = Number(searchParams.get('offset') || 0);

    const petId = searchParams.get('petId');
    const customerId = searchParams.get('customerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const tagsParam = searchParams.get('tags');

    const supabase = getServiceSupabase();

    // Build query for count
    let countQuery = supabase
      .from('grooming_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Build query for data
    let dataQuery = supabase
      .from('grooming_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters to both queries
    if (petId) {
      countQuery = countQuery.eq('pet_id', petId);
      dataQuery = dataQuery.eq('pet_id', petId);
    }

    if (customerId) {
      // Filter by customer: get pet IDs belonging to customer
      const { data: customerPets } = await supabase
        .from('pets')
        .select('id')
        .eq('customer_id', customerId)
        .eq('user_id', userId);

      const petIds = customerPets?.map((p) => p.id) || [];
      if (petIds.length === 0) {
        return NextResponse.json({ data: [], total: 0 });
      }
      countQuery = countQuery.in('pet_id', petIds);
      dataQuery = dataQuery.in('pet_id', petIds);
    }

    if (dateFrom) {
      countQuery = countQuery.gte('created_at', dateFrom);
      dataQuery = dataQuery.gte('created_at', dateFrom);
    }

    if (dateTo) {
      countQuery = countQuery.lte('created_at', dateTo);
      dataQuery = dataQuery.lte('created_at', dateTo);
    }

    if (search?.trim()) {
      const searchFilter = `summary.ilike.%${search.trim()}%,internal_memo.ilike.%${search.trim()}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    if (tagsParam) {
      try {
        const tags = JSON.parse(tagsParam);
        if (Array.isArray(tags) && tags.length > 0) {
          countQuery = countQuery.contains('tags', tags);
          dataQuery = dataQuery.contains('tags', tags);
        }
      } catch {
        // Ignore invalid tags param
      }
    }

    const [{ count }, { data, error }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    // Enrich with pet/customer names
    const enrichedData = data || [];
    const petIds = Array.from(new Set(enrichedData.filter((d) => d.pet_id).map((d) => d.pet_id)));

    if (petIds.length > 0) {
      const { data: pets } = await supabase
        .from('pets')
        .select('id, name, customer_id')
        .in('id', petIds);

      const customerIds = Array.from(new Set(pets?.map((p) => p.customer_id) || []));
      let customerMap: Record<string, string> = {};

      if (customerIds.length > 0) {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIds);

        customerMap = Object.fromEntries(
          customers?.map((c) => [c.id, c.name]) || [],
        );
      }

      const petMap = Object.fromEntries(
        pets?.map((p) => [p.id, { name: p.name, customerId: p.customer_id }]) || [],
      );

      for (const log of enrichedData) {
        if (log.pet_id && petMap[log.pet_id]) {
          (log as any).pet_name = petMap[log.pet_id].name;
          (log as any).customer_name = customerMap[petMap[log.pet_id].customerId] || null;
        }
      }
    }

    return NextResponse.json({ data: enrichedData, total: count || 0 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
