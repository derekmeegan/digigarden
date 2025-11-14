import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from('flowers')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return Response.json({ error: 'Flower not found' }, { status: 404 });
  }

  return Response.json(data);
}
