'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Users, UserCheck } from 'lucide-react'

export default function DashboardPage() {

  // Estado para cada métrica del dashboard
  const [ingresosDia, setIngresosDia]   = useState(0)
  const [ingresosSemana, setIngresosSemana] = useState(0)
  const [ingresosMes, setIngresosMes]   = useState(0)
  const [nuevosEsteMes, setNuevosEsteMes] = useState(0)
  const [activos, setActivos]           = useState(0)
  const [vencidos, setVencidos]         = useState(0)
  const [total, setTotal]               = useState(0)
  const [vencenHoy, setVencenHoy]       = useState<any[]>([])
  const [vencenManana, setVencenManana] = useState<any[]>([])
  const [graficaIngresos, setGraficaIngresos] = useState<any[]>([])
  const [graficaTipos, setGraficaTipos] = useState<any[]>([])

  useEffect(() => {
    // Ejecuta todas las consultas al cargar la página
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const hoy = new Date().toISOString().split('T')[0]
    
    // Fecha de inicio de la semana (últimos 7 días)
    const semana = new Date()
    semana.setDate(semana.getDate() - 7)
    const fechaSemana = semana.toISOString().split('T')[0]
    
    // Fecha de inicio del mes actual
    const mes = new Date()
    mes.setDate(1)
    const fechaMes = mes.toISOString().split('T')[0]

    // Fecha de mañana
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    const fechaManana = manana.toISOString().split('T')[0]

    // Ingresos del día — suma todos los pagos de hoy
    const { data: pagosDia } = await supabase
      .from('pagos')
      .select('monto')
      .gte('created_at', hoy)
    setIngresosDia(pagosDia?.reduce((sum, p) => sum + p.monto, 0) || 0)

    // Ingresos de la semana
    const { data: pagosSemana } = await supabase
      .from('pagos')
      .select('monto')
      .gte('created_at', fechaSemana)
    setIngresosSemana(pagosSemana?.reduce((sum, p) => sum + p.monto, 0) || 0)

    // Ingresos del mes
    const { data: pagosMes } = await supabase
      .from('pagos')
      .select('monto')
      .gte('created_at', fechaMes)
    setIngresosMes(pagosMes?.reduce((sum, p) => sum + p.monto, 0) || 0)

    // Miembros nuevos este mes
    const { count: nuevos } = await supabase
      .from('miembros')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fechaMes)
    setNuevosEsteMes(nuevos || 0)

    // Total de miembros
    const { count: totalM } = await supabase
      .from('miembros')
      .select('*', { count: 'exact', head: true })
    setTotal(totalM || 0)

    // Miembros activos — su último pago tiene fecha_vencimiento >= hoy
    const { data: pagosActivos } = await supabase
      .from('pagos')
      .select('miembro_id, fecha_vencimiento')
      .gte('fecha_vencimiento', hoy)
    const activosUnicos = new Set(pagosActivos?.map(p => p.miembro_id))
    setActivos(activosUnicos.size)
    setVencidos((totalM || 0) - activosUnicos.size)

    // Miembros que vencen hoy
    // Trae todos los pagos con fecha_vencimiento >= hoy para verificar renovaciones
    const { data: todosPagos } = await supabase
      .from('pagos')
      .select('miembro_id, fecha_vencimiento')
      .gte('fecha_vencimiento', hoy)

    // Miembros que vencen hoy
    const { data: hoyVencen } = await supabase
    .from('pagos')
    .select('miembro_id, miembros(nombre, telefono)')
    .eq('fecha_vencimiento', hoy)

// Filtra los que ya tienen un pago con fecha_vencimiento mayor a hoy
const vencenHoyFiltrados = (hoyVencen || []).filter((p: any) => {
  const tieneRenovacion = todosPagos?.some(
    (otro: any) =>
      otro.miembro_id === p.miembro_id &&
      otro.fecha_vencimiento > hoy
  )
  return !tieneRenovacion
})
setVencenHoy(vencenHoyFiltrados)

// Miembros que vencen mañana
const { data: mananaVencen } = await supabase
  .from('pagos')
  .select('miembro_id, miembros(nombre, telefono)')
  .eq('fecha_vencimiento', fechaManana)

// Filtra los que ya tienen un pago con fecha_vencimiento mayor a mañana
const vencenMananaFiltrados = (mananaVencen || []).filter((p: any) => {
  const tieneRenovacion = todosPagos?.some(
    (otro: any) =>
      otro.miembro_id === p.miembro_id &&
      otro.fecha_vencimiento > fechaManana
  )
  return !tieneRenovacion
})
setVencenManana(vencenMananaFiltrados)

    // Gráfica de ingresos últimos 7 días
    const { data: pagosGrafica } = await supabase
      .from('pagos')
      .select('monto, created_at')
      .gte('created_at', fechaSemana)
      .order('created_at')
    
    // Agrupa los pagos por día para la gráfica
    const porDia: Record<string, number> = {}
    pagosGrafica?.forEach(p => {
      const dia = p.created_at.split('T')[0]
      porDia[dia] = (porDia[dia] || 0) + p.monto
    })
    setGraficaIngresos(
      Object.entries(porDia).map(([fecha, monto]) => ({
        fecha: fecha.slice(5), // muestra solo MM-DD
        monto
      }))
    )

    // Gráfica de miembros por tipo de membresía
    const { data: pagosTipos } = await supabase
      .from('pagos')
      .select('membresias(tipo)')
      .gte('fecha_vencimiento', hoy)
    
    const porTipo: Record<string, number> = {}
    pagosTipos?.forEach((p: any) => {
      const tipo = p.membresias?.tipo || 'otro'
      porTipo[tipo] = (porTipo[tipo] || 0) + 1
    })
    setGraficaTipos(
      Object.entries(porTipo).map(([tipo, cantidad]) => ({ tipo, cantidad }))
    )
  }

  return (
    <div className="space-y-6">

      {/* Título */}
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Fila de tarjetas de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard titulo="Ingresos del día"  valor={`$${ingresosDia}`}    icon={<TrendingUp size={16} className="text-gray-400"/>} />
        <MetricCard titulo="Semana"            valor={`$${ingresosSemana}`} icon={<TrendingUp size={16} className="text-gray-400"/>} />
        <MetricCard titulo="Mes"               valor={`$${ingresosMes}`}    icon={<TrendingUp size={16} className="text-gray-400"/>} />
        <MetricCard titulo="Nuevos este mes"   valor={nuevosEsteMes}        icon={<Users size={16} className="text-gray-400"/>} />
      </div>

      {/* Fila de activos / vencidos / total */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard titulo="Activos"  valor={activos}  color="text-green-600" />
        <MetricCard titulo="Vencidos" valor={vencidos} color="text-red-500" />
        <MetricCard titulo="Total"    valor={total} />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-2 gap-4">

        {/* Gráfica de ingresos últimos 7 días */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-medium mb-4">Ingresos últimos 7 días</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={graficaIngresos}>
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="monto" stroke="#000" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de miembros por tipo */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-medium mb-4">Miembros por tipo</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={graficaTipos}>
              <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#000" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Próximos vencimientos */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-medium mb-4">Próximos vencimientos</h2>

        {/* Vencen hoy */}
        {vencenHoy.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-red-500 mb-2">Vencen hoy</p>
            {vencenHoy.map((v: any, i) => (
              <div key={i} className="flex justify-between py-2 border-b last:border-0 text-sm">
                <span>{v.miembros?.nombre}</span>
                <span className="text-gray-500">{v.miembros?.telefono}</span>
              </div>
            ))}
          </div>
        )}

        {/* Vencen mañana */}
        {vencenManana.length > 0 && (
          <div>
            <p className="text-xs font-medium text-orange-500 mb-2">Vencen mañana</p>
            {vencenManana.map((v: any, i) => (
              <div key={i} className="flex justify-between py-2 border-b last:border-0 text-sm">
                <span>{v.miembros?.nombre}</span>
                <span className="text-gray-500">{v.miembros?.telefono}</span>
              </div>
            ))}
          </div>
        )}

        {/* Si no hay vencimientos */}
        {vencenHoy.length === 0 && vencenManana.length === 0 && (
          <p className="text-sm text-gray-400">No hay vencimientos próximos</p>
        )}
      </div>

    </div>
  )
}

// Componente reutilizable para las tarjetas de métricas
function MetricCard({ titulo, valor, icon, color }: {
  titulo: string
  valor: string | number
  icon?: React.ReactNode
  color?: string
}) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        {icon}
        {titulo}
      </div>
      <p className={`text-2xl font-bold ${color || ''}`}>{valor}</p>
    </div>
  )
}