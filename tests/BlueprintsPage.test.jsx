import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import reducer from '../src/features/blueprints/blueprintsSlice.js'
import service from '../src/services/blueprintsService.js'
import BlueprintsPage from '../src/pages/BlueprintsPage.jsx'

// Store y thunks reales; solo se reemplaza el servicio para no requerir backend
vi.mock('../src/services/blueprintsService.js', () => ({
  default: {
    getAll: vi.fn(),
    getByAuthor: vi.fn(),
    getByAuthorAndName: vi.fn(),
    create: vi.fn(),
  },
}))

const house = {
  author: 'JohnConnor',
  name: 'house',
  points: [
    { x: 10, y: 10 },
    { x: 20, y: 20 },
    { x: 30, y: 30 },
  ],
}
const garage = { author: 'JohnConnor', name: 'garage', points: [{ x: 5, y: 5 }] }

function renderPage() {
  const store = configureStore({ reducer: { blueprints: reducer } })
  render(
    <Provider store={store}>
      <BlueprintsPage />
    </Provider>,
  )
  return store
}

function searchAuthor(author) {
  fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: author } })
  fireEvent.click(screen.getByRole('button', { name: /Get blueprints/i }))
}

describe('BlueprintsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    service.getAll.mockResolvedValue([house, garage])
  })

  it('despacha fetchByAuthor al hacer click en Get blueprints y pinta la tabla', async () => {
    service.getByAuthor.mockResolvedValue([house, garage])
    const store = renderPage()

    searchAuthor('JohnConnor')

    expect(service.getByAuthor).toHaveBeenCalledWith('JohnConnor')
    expect(await screen.findByRole('cell', { name: 'house' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'garage' })).toBeInTheDocument()
    expect(screen.getByText('Total user points: 4')).toBeInTheDocument()
    expect(store.getState().blueprints.byAuthor.JohnConnor).toHaveLength(2)
  })

  it('muestra el estado de carga mientras llega la respuesta', async () => {
    service.getByAuthor.mockReturnValue(new Promise(() => {}))
    renderPage()

    searchAuthor('JohnConnor')

    expect(await screen.findByRole('status')).toHaveTextContent('Cargando planos de JohnConnor')
    expect(screen.getByRole('button', { name: 'Cargando...' })).toBeDisabled()
  })

  it('Open trae el plano y su nombre queda como plano actual (estado Redux)', async () => {
    service.getByAuthor.mockResolvedValue([house])
    service.getByAuthorAndName.mockResolvedValue(house)
    const store = renderPage()

    searchAuthor('JohnConnor')
    fireEvent.click(await screen.findByRole('button', { name: 'Open' }))

    expect(service.getByAuthorAndName).toHaveBeenCalledWith('JohnConnor', 'house')
    expect(
      await screen.findByRole('heading', { name: 'Current blueprint: house' }),
    ).toBeInTheDocument()
    expect(store.getState().blueprints.current).toEqual(house)
  })

  it('si el GET falla muestra un banner y Reintentar vuelve a disparar el thunk', async () => {
    service.getByAuthor
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce([house])
    renderPage()

    searchAuthor('JohnConnor')

    const banner = await screen.findByRole('alert')
    expect(banner).toHaveTextContent('No se pudieron cargar los planos: Network Error')

    fireEvent.click(within(banner).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('cell', { name: 'house' })).toBeInTheDocument()
    expect(service.getByAuthor).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('si falla abrir un plano el banner aparece en el canvas y Reintentar lo vuelve a pedir', async () => {
    service.getByAuthor.mockResolvedValue([house])
    service.getByAuthorAndName
      .mockRejectedValueOnce(new Error('timeout of 8000ms exceeded'))
      .mockResolvedValueOnce(house)
    renderPage()

    searchAuthor('JohnConnor')
    fireEvent.click(await screen.findByRole('button', { name: 'Open' }))

    const banner = await screen.findByRole('alert')
    expect(banner).toHaveTextContent('No se pudo abrir el plano')
    fireEvent.click(within(banner).getByRole('button', { name: 'Reintentar' }))

    expect(
      await screen.findByRole('heading', { name: 'Current blueprint: house' }),
    ).toBeInTheDocument()
    expect(service.getByAuthorAndName).toHaveBeenLastCalledWith('JohnConnor', 'house')
  })

  it('si falla cargar los autores muestra el banner con Reintentar', async () => {
    service.getAll.mockReset()
    service.getAll.mockRejectedValueOnce(new Error('No autorizado')).mockResolvedValueOnce([house])
    renderPage()

    const banner = await screen.findByRole('alert')
    expect(banner).toHaveTextContent('No se pudieron cargar los autores: No autorizado')
    fireEvent.click(within(banner).getByRole('button', { name: 'Reintentar' }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(service.getAll).toHaveBeenCalledTimes(2)
  })
})
