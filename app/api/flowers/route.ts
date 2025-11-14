import { supabase } from '@/lib/supabase';
import { generateSlug } from '@/lib/flower-data';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const minX = searchParams.get('minX');
  const maxX = searchParams.get('maxX');

  let query = supabase.from('flowers').select('*');

  if (minX) query = query.gte('x', parseInt(minX));
  if (maxX) query = query.lte('x', parseInt(maxX));

  const { data, error } = await query;
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, message, author, x, y, flower } = body;

  // Validation
  if (!title || !message || x === undefined || y === undefined || !flower) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Generate slug from title
  const slug = generateSlug(title);

  const { data, error } = await supabase
    .from('flowers')
    .insert({ title, slug, message, author, x, y, flower })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
