import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import reducer, {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  createBlueprint,
} from '../src/features/blueprints/blueprintsSlice.js'
import service from '../src/services/blueprintsService.js'

vi.mock('../src/services/blueprintsService.js', () => ({
  default: {
    getAll: vi.fn(),
    getByAuthor: vi.fn(),
    getByAuthorAndName: vi.fn(),
    create: vi.fn(),
  },
}))

const house = { author: 'john', name: 'house', points: [{ x: 1, y: 1 }] }
const initial = reducer(undefined, { type: '@@INIT' })

describe('blueprints slice (reducers puros)', () => {
  it('should initialize correctly', () => {
    expect(initial.authors).toEqual([])
    expect(initial.byAuthor).toEqual({})
    expect(initial.current).toBeNull()
    expect(initial.status).toEqual({
      authors: 'idle',
      byAuthor: 'idle',
      current: 'idle',
      create: 'idle',
    })
  })

  it('fetchByAuthor.pending marca loading y limpia el error previo', () => {
    const prev = { ...initial, error: { ...initial.error, byAuthor: 'boom' } }
    const s = reducer(prev, fetchByAuthor.pending('req', 'john'))
    expect(s.status.byAuthor).toBe('loading')
    expect(s.error.byAuthor).toBeNull()
  })

  it('fetchByAuthor.fulfilled guarda los planos bajo su autor', () => {
    const s = reducer(initial, fetchByAuthor.fulfilled({ author: 'john', items: [house] }, 'req'))
    expect(s.status.byAuthor).toBe('succeeded')
    expect(s.byAuthor.john).toEqual([house])
  })

  it('fetchByAuthor.fulfilled con algo que no es arreglo deja la lista vacía', () => {
    const s = reducer(initial, fetchByAuthor.fulfilled({ author: 'john', items: null }, 'req'))
    expect(s.byAuthor.john).toEqual([])
  })

  it('un rechazo solo afecta el status/error de su propio thunk', () => {
    const s = reducer(initial, fetchBlueprint.rejected(new Error('Network Error'), 'req', {}))
    expect(s.status.current).toBe('failed')
    expect(s.error.current).toBe('Network Error')
    expect(s.status.byAuthor).toBe('idle')
    expect(s.error.byAuthor).toBeNull()
  })

  it('fetchBlueprint.fulfilled deja el plano como actual', () => {
    const s = reducer(initial, fetchBlueprint.fulfilled(house, 'req', {}))
    expect(s.current).toEqual(house)
    expect(s.status.current).toBe('succeeded')
  })

  it('createBlueprint.fulfilled agrega el plano a la lista ya cargada del autor', () => {
    const loaded = { ...initial, byAuthor: { john: [house] } }
    const garage = { author: 'john', name: 'garage', points: [] }
    const s = reducer(loaded, createBlueprint.fulfilled(garage, 'req', garage))
    expect(s.byAuthor.john.map((bp) => bp.name)).toEqual(['house', 'garage'])
    expect(s.status.create).toBe('succeeded')
  })
})

describe('blueprints thunks con un store real', () => {
  const makeStore = () => configureStore({ reducer: { blueprints: reducer } })

  beforeEach(() => vi.resetAllMocks())

  it('fetchAuthors deriva autores únicos de getAll', async () => {
    service.getAll.mockResolvedValue([house, { ...house, name: 'garage' }, { author: 'ana' }])
    const store = makeStore()
    await store.dispatch(fetchAuthors())
    expect(store.getState().blueprints.authors).toEqual(['john', 'ana'])
  })

  it('fetchByAuthor llama al servicio y guarda el resultado', async () => {
    service.getByAuthor.mockResolvedValue([house])
    const store = makeStore()
    await store.dispatch(fetchByAuthor('john'))
    expect(service.getByAuthor).toHaveBeenCalledWith('john')
    expect(store.getState().blueprints.byAuthor.john).toEqual([house])
  })

  it('si el servicio falla el error queda en el estado', async () => {
    service.getByAuthorAndName.mockRejectedValue(new Error('No autorizado'))
    const store = makeStore()
    await store.dispatch(fetchBlueprint({ author: 'john', name: 'house' }))
    const s = store.getState().blueprints
    expect(s.status.current).toBe('failed')
    expect(s.error.current).toBe('No autorizado')
    expect(s.current).toBeNull()
  })

  it('createBlueprint envía el payload al servicio', async () => {
    service.create.mockResolvedValue(house)
    const store = makeStore()
    const result = await store.dispatch(createBlueprint(house)).unwrap()
    expect(service.create).toHaveBeenCalledWith(house)
    expect(result).toEqual(house)
  })
})
