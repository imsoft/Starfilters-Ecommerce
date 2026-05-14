import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth-utils';
import { reorderCaseStudies } from '@/lib/database';

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResult = await requireAdmin(cookies);
  if (authResult.redirect) {
    return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return new Response(JSON.stringify({ success: false, message: 'items debe ser un array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const success = await reorderCaseStudies(items);
    return new Response(JSON.stringify({ success }), {
      status: success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
