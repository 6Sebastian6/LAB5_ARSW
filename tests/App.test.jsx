import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import reducer from '../src/features/blueprints/blueprintsSlice.js'
import service from '../src/services/blueprintsService.js'
import api from '../src/services/apiClient.js'
import App from '../src/App.jsx'

vi.mock('../src/services/apiClient.js', () => ({ default: { post: vi.fn() } }))
vi.mock('../src/services/blueprintsService.js', () => ({
  default: {
    getAll: vi.fn(),
    getByAuthor: vi.fn(),
    getByAuthorAndName: vi.fn(),
    create: vi.fn(),
  },
}))

function renderApp(path) {
  const store = configureStore({ reducer: { blueprints: reducer } })
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </Provider>,
  )
}

function fillLogin(username, password) {
  fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: username } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
}

describe('Rutas protegidas (PrivateRoute + JWT)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
  })

  it('sin token, crear un blueprint redirige al login', () => {
    renderApp('/blueprints/new')
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Crear Blueprint' })).not.toBeInTheDocument()
  })

  it('tras el login guarda el JWT y vuelve a la ruta protegida', async () => {
    api.post.mockResolvedValue({ data: { access_token: 'jwt-123', token_type: 'Bearer' } })
    renderApp('/blueprints/new')

    fillLogin('student', 'student123')

    expect(await screen.findByRole('heading', { name: 'Crear Blueprint' })).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      username: 'student',
      password: 'student123',
    })
    expect(localStorage.getItem('token')).toBe('jwt-123')
  })

  it('con credenciales inválidas muestra el error y no guarda token', async () => {
    api.post.mockRejectedValue(new Error('401'))
    renderApp('/login')

    fillLogin('student', 'mala')

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas')
    expect(localStorage.getItem('token')).toBeNull()
  })
})

describe('Crear blueprint (ruta protegida)', () => {
  const bp = { author: 'john', name: 'house', points: [{ x: 1, y: 2 }] }

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('token', 'jwt-123')
    vi.resetAllMocks()
  })

  function submitForm() {
    fireEvent.change(screen.getByLabelText('Autor'), { target: { value: bp.author } })
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: bp.name } })
    fireEvent.change(screen.getByLabelText(/Puntos/), { target: { value: '[{"x":1,"y":2}]' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
  }

  it('con token envía el POST y navega al detalle del plano creado', async () => {
    service.create.mockResolvedValue(bp)
    service.getByAuthorAndName.mockResolvedValue(bp)
    renderApp('/blueprints/new')

    submitForm()

    expect(await screen.findByRole('heading', { name: 'house' })).toBeInTheDocument()
    expect(service.create).toHaveBeenCalledWith(bp)
    expect(service.getByAuthorAndName).toHaveBeenCalledWith('john', 'house')
  })

  it('si el POST falla muestra el mensaje del backend y se queda en el formulario', async () => {
    service.create.mockRejectedValue(new Error('Blueprint already exists'))
    renderApp('/blueprints/new')

    submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo crear el plano: Blueprint already exists',
    )
    expect(screen.getByRole('heading', { name: 'Crear Blueprint' })).toBeInTheDocument()
  })
})
