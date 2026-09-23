import { useState } from 'react'

export default function BlueprintForm({ onSubmit, submitting = false }) {
  const [author, setAuthor] = useState('')
  const [name, setName] = useState('')
  const [pointsJSON, setPointsJSON] = useState('[{"x":10,"y":10},{"x":40,"y":60}]')
  const [error, setError] = useState(null)

  const handle = (e) => {
    e.preventDefault()
    let points
    try {
      points = JSON.parse(pointsJSON)
    } catch {
      setError('JSON de puntos inválido')
      return
    }
    if (!Array.isArray(points)) {
      setError('Los puntos deben ser un arreglo JSON, ej: [{"x":10,"y":10}]')
      return
    }
    setError(null)
    onSubmit({ author, name, points })
  }

  return (
    <form onSubmit={handle} className="card">
      <h3 style={{ marginTop: 0 }}>Crear Blueprint</h3>
      <div className="grid cols-2">
        <div>
          <label htmlFor="bp-author">Autor</label>
          <input
            id="bp-author"
            className="input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="juan.perez"
            required
          />
        </div>
        <div>
          <label htmlFor="bp-name">Nombre</label>
          <input
            id="bp-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mi-dibujo"
            required
          />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label htmlFor="bp-points">Puntos (JSON)</label>
        <textarea
          id="bp-points"
          className="input"
          rows="5"
          value={pointsJSON}
          onChange={(e) => setPointsJSON(e.target.value)}
        />
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div style={{ marginTop: 12 }}>
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
