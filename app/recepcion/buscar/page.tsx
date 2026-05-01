'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ResultadoBusqueda = {
  id: string
  nombre: string
  telefono: string
  estado: string
  tipo: string
  fechaVencimiento: string
  estadoCalculado: 'activo' | 'por_vencer' | 'vencido' | 'congelado'
  fotoUrl: string
}

export default function BuscarPage() {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [buscando, setBuscando] = useState(false)
  const [registrando, setRegistrando] = useState<string | null>(null)
  const [entradaRegistrada, setEntradaRegistrada] = useState<string | null>(null)
  const [fotoModal, setFotoModal] = useState<string | null>(null)
  const router = useRouter()

  async function buscarMiembro() {
    if (!busqueda.trim()) return
    setBuscando(true)
    setResultados([])
    setEntradaRegistrada(null)

    const { data } = await supabase
  .from('miembros')
  .select(`
    id, nombre, telefono, estado, foto_url,
    pagos(fecha_vencimiento, membresias(tipo))
  `)
  .ilike('nombre', `%${busqueda}%`)
  .order('nombre')

    if (data) {
      const conEstado = data.map((m: any) => {
        const ultimoPago = m.pagos?.sort((a: any, b: any) =>
          new Date(b.fecha_vencimiento).getTime() - new Date(a.fecha_vencimiento).getTime()
        )[0]

        let estadoCalculado: 'activo' | 'por_vencer' | 'vencido' | 'congelado' = 'vencido'
        if (m.estado === 'congelado') {
          estadoCalculado = 'congelado'
        } else if (ultimoPago) {
          const fechaVence = new Date(ultimoPago.fecha_vencimiento + 'T00:00:00')
          const diffDias = Math.ceil((fechaVence.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          if (diffDias >= 3) estadoCalculado = 'activo'
          else if (diffDias >= 0) estadoCalculado = 'por_vencer'
          else estadoCalculado = 'vencido'
        }

        return {
          id: m.id,
          nombre: m.nombre,
          telefono: m.telefono,
          estado: m.estado,
          tipo: ultimoPago?.membresias?.tipo || '—',
          fechaVencimiento: ultimoPago?.fecha_vencimiento || '',
          estadoCalculado,
          fotoUrl: m.foto_url || '',
        }
      })
      setResultados(conEstado)
    }
    setBuscando(false)
  }

  async function registrarEntrada(miembro: ResultadoBusqueda) {
    if (miembro.estadoCalculado === 'vencido' || miembro.estadoCalculado === 'congelado') return
    setRegistrando(miembro.id)
    await supabase
      .from('visitas')
      .insert({ miembro_id: miembro.id })
    setEntradaRegistrada(miembro.id)
    setRegistrando(null)
  }

  const badgeEstado = {
    activo:     { clase: 'text-green-600 bg-green-50',   texto: 'Activo' },
    por_vencer: { clase: 'text-orange-500 bg-orange-50', texto: 'Por vencer' },
    vencido:    { clase: 'text-red-500 bg-red-50',       texto: 'Vencido' },
    congelado:  { clase: 'text-blue-500 bg-blue-50',     texto: 'Congelado' },
  }

  return (
    <div className="space-y-6">

      {/* Tarjeta de búsqueda */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <Search size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-medium">Búsqueda manual</h2>
            <p className="text-sm text-gray-500">Busca miembros por nombre</p>
          </div>
        </div>

        {/* Input de búsqueda */}
        <div className="flex gap-2">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarMiembro()}
            placeholder="Escribe el nombre del miembro..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={buscarMiembro}
            disabled={buscando}
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Search size={16} />
            Buscar
          </button>
        </div>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="space-y-3">
          {resultados.map((m) => {
            const badge = badgeEstado[m.estadoCalculado]
            const puedeEntrar = m.estadoCalculado === 'activo' || m.estadoCalculado === 'por_vencer'
            const yaEntro = entradaRegistrada === m.id

            return (
              <div key={m.id} className="bg-white rounded-lg border p-4">
  <div className="flex justify-between items-start">
    <div className="flex items-center gap-3">
      {/* Foto del miembro */}
      {m.fotoUrl ? (
        <img
          src={m.fotoUrl}
          alt={m.nombre}
          onClick={(e) => { e.stopPropagation(); setFotoModal(m.fotoUrl) }}
          className="w-12 h-12 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border">
          <span className="text-gray-400 text-lg">👤</span>
        </div>
      )}
      <div>
        <p className="font-medium">{m.nombre}</p>
        <p className="text-sm text-gray-500">{m.telefono}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.clase}`}>
            {badge.texto}
          </span>
          <span className="text-xs text-gray-500 capitalize">{m.tipo}</span>
          {m.fechaVencimiento && (
            <span className="text-xs text-gray-400">
              · Vence {new Date(m.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-MX')}
            </span>
          )}
        </div>
      </div>
    </div>

                  <div className="flex flex-col gap-2 items-end">
                    {yaEntro ? (
                      <span className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                        Entrada registrada
                      </span>
                    ) : puedeEntrar ? (
                      <button
                        onClick={() => registrarEntrada(m)}
                        disabled={registrando === m.id}
                        className="cursor-pointer bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {registrando === m.id ? 'Registrando...' : 'Registrar entrada'}
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push(`/recepcion/cobros?id=${m.id}`)}
                        className="cursor-pointer bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600"
                      >
                        Registrar pago
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sin resultados */}
      {resultados.length === 0 && busqueda && !buscando && (
        <div className="bg-white rounded-lg border p-6 text-center">
          <p className="text-sm text-gray-400">No se encontraron miembros con ese nombre</p>
        </div>
      )}
      
      {/* Modal de foto */}
      {fotoModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setFotoModal(null)}
        >
          <div className="relative max-w-sm w-full">
            <img
              src={fotoModal}
              alt="Foto del miembro"
              className="w-full rounded-lg object-cover"
            />
            <button
              onClick={() => setFotoModal(null)}
              className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-800 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  )
}