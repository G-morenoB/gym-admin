// Obtiene la fecha actual en zona horaria de México como string YYYY-MM-DD
export function fechaHoyMexico(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Mexico_City'
  })
}

// Suma días a la fecha actual en zona horaria de México
export function fechaVencimientoMexico(dias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  return fecha.toLocaleDateString('en-CA', {
    timeZone: 'America/Mexico_City'
  })
}