import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createBlueprint } from '../features/blueprints/blueprintsSlice.js'
import BlueprintForm from '../components/BlueprintForm.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'

// Ruta protegida (ver PrivateRoute en App.jsx): el POST exige JWT en el backend.
export default function CreateBlueprintPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error } = useSelector((s) => s.blueprints)

  const save = async (payload) => {
    try {
      const bp = await dispatch(createBlueprint(payload)).unwrap()
      navigate(`/blueprints/${encodeURIComponent(bp.author)}/${encodeURIComponent(bp.name)}`)
    } catch {
      // El error ya quedo en el slice (error.create) y se muestra en el banner
    }
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      {status.create === 'failed' && (
        <ErrorBanner message={`No se pudo crear el plano: ${error.create}`} />
      )}
      <BlueprintForm onSubmit={save} submitting={status.create === 'loading'} />
    </div>
  )
}
