import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { verifyLiffToken, authErrorResponse } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { userId } = await verifyLiffToken(req);

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (audioFile.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const fileId = crypto.randomUUID();
    const filePath = `${userId}/${fileId}.mp3`;

    const buffer = Buffer.from(await audioFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('audio_uploads')
      .upload(filePath, buffer, {
        contentType: audioFile.type || 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 });
    }

    return NextResponse.json({ url: filePath }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
