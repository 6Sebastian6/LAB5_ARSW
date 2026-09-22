import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
} from '../features/blueprints/blueprintsSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const { authors, byAuthor, current, status, error } = useSelector((s) => s.blueprints)
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [lastOpened, setLastOpened] = useState(null)
  const items = byAuthor[selectedAuthor] || []
  const listLoading = status.byAuthor === 'loading'
  const listFailed = status.byAuthor === 'failed'

  useEffect(() => {
    dispatch(fetchAuthors())
  }, [dispatch])

  const totalPoints = useMemo(
    () => items.reduce((acc, bp) => acc + (bp.points?.length || 0), 0),
    [items],
  )

  const getBlueprints = () => {
    const author = authorInput.trim()
    if (!author) return
    setSelectedAuthor(author)
    dispatch(fetchByAuthor(author))
  }

  const openBlueprint = (bp) => {
    const ref = { author: bp.author, name: bp.name }
    setLastOpened(ref)
    dispatch(fetchBlueprint(ref))
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '1.1fr 1.4fr', gap: 24 }}>
      <section className="grid" style={{ gap: 16, alignContent: 'start' }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Blueprints</h2>
          <ErrorBanner
            message={error.authors && `No se pudieron cargar los autores: ${error.authors}`}
            onRetry={() => dispatch(fetchAuthors())}
          />
          <form
            style={{ display: 'flex', gap: 12 }}
            onSubmit={(e) => {
              e.preventDefault()
              getBlueprints()
            }}
          >
            <input
              className="input"
              placeholder="Author"
              aria-label="Author"
              list="authors-list"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
            />
            <datalist id="authors-list">
              {authors.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            <button className="btn primary" disabled={listLoading}>
              {listLoading ? 'Cargando...' : 'Get blueprints'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            {selectedAuthor ? `${selectedAuthor}'s blueprints:` : 'Results'}
          </h3>
          {listFailed && (
            <ErrorBanner
              message={`No se pudieron cargar los planos: ${error.byAuthor}`}
              onRetry={() => dispatch(fetchByAuthor(selectedAuthor))}
            />
          )}
          {listLoading && (
            <p className="muted" role="status">
              Cargando planos de {selectedAuthor}...
            </p>
          )}
          {!items.length && !listLoading && !listFailed && (
            <p className="muted">
              {selectedAuthor ? 'Sin resultados.' : 'Escribe un autor y presiona Get blueprints.'}
            </p>
          )}
          {!!items.length && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px',
                        borderBottom: '1px solid #334155',
                      }}
                    >
                      Blueprint name
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        padding: '8px',
                        borderBottom: '1px solid #334155',
                      }}
                    >
                      Number of points
                    </th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #334155' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((bp) => (
                    <tr key={bp.name}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>
                        {bp.name}
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          textAlign: 'right',
                          borderBottom: '1px solid #1f2937',
                        }}
                      >
                        {bp.points?.length || 0}
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #1f2937' }}>
                        <button className="btn" onClick={() => openBlueprint(bp)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ marginTop: 12, fontWeight: 700 }}>Total user points: {totalPoints}</p>
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Current blueprint: {current?.name || '—'}</h3>
        {status.current === 'failed' && (
          <ErrorBanner
            message={`No se pudo abrir el plano: ${error.current}`}
            onRetry={() => dispatch(fetchBlueprint(lastOpened))}
          />
        )}
        {status.current === 'loading' && (
          <p className="muted" role="status">
            Cargando plano...
          </p>
        )}
        <BlueprintCanvas points={current?.points || []} />
      </section>
    </div>
  )
}
