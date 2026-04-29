import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Paso 1 — Obtiene los IDs de membresías por visita
  const { data: membresias } = await supabase
    .from('membresias')
    .select('id')
    .eq('tipo', 'por_visita')

  if (!membresias || membresias.length === 0) {
    return NextResponse.json({ mensaje: 'No hay membresías por visita' })
  }

  const membresiaIds = membresias.map(m => m.id)

  // Paso 2 — Obtiene los IDs de miembros con membresía por visita
  const { data: pagos } = await supabase
    .from('pagos')
    .select('miembro_id')
    .in('membresia_id', membresiaIds)

  if (!pagos || pagos.length === 0) {
    return NextResponse.json({ mensaje: 'No hay miembros con membresía por visita' })
  }

  const miembroIds = [...new Set(pagos.map(p => p.miembro_id))]

  // Paso 3 — Elimina visitas de esos miembros mayores a 30 días
  const fechaLimite = new Date()
  fechaLimite.setDate(fechaLimite.getDate() - 30)

  const { error, count } = await supabase
    .from('visitas')
    .delete({ count: 'exact' })
    .in('miembro_id', miembroIds)
    .lt('fecha_entrada', fechaLimite.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    mensaje: `Limpieza completada. ${count} visitas eliminadas.`
  })
}