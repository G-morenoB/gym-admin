'use client'
// Le dice a Next.js que este componente corre en el navegador
// no en el servidor — necesario para manejar formularios

import { useState } from 'react'
// useState guarda los valores del formulario mientras el usuario escribe

import { useRouter } from 'next/navigation'
// useRouter permite redirigir al usuario a otra página

import { supabase } from '@/lib/supabase'
// Importa la conexión con Supabase que creamos antes

export default function LoginPage() {
  // Guarda el email que escribe el usuario
  const [email, setEmail] = useState('')
  
  // Guarda la contraseña que escribe el usuario
  const [password, setPassword] = useState('')
  
  // Guarda el mensaje de error si el login falla
  const [error, setError] = useState('')
  
  // Guarda si está cargando para deshabilitar el botón
  const [loading, setLoading] = useState(false)
  
  // Permite redirigir al usuario después del login
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    // Evita que la página se recargue al dar clic en el botón
    e.preventDefault()
    
    setLoading(true)
    setError('')

    // Intenta iniciar sesión con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Si hay error muestra el mensaje y detiene la carga
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Si el login fue exitoso busca el rol del usuario
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', data.user.id)
      .single()

    // Redirige según el rol
    if (usuario?.rol === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/recepcion/qr')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        
        {/* np */}
        <h1 className="text-2xl font-bold text-center mb-2">Aquiles Gym</h1>
        <p className="text-gray-500 text-center mb-6">Inicia sesión para continuar</p>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Campo email */}
          <div>
            <label className="block text-sm font-medium mb-1">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          {/* Campo contraseña */}
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Mensaje de error si el login falla */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Botón de login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

        </form>
      </div>
    </div>
  )
}