import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import blueprintsService from '../../services/blueprintsService.js'

export const fetchAuthors = createAsyncThunk('blueprints/fetchAuthors', async () => {
  const data = await blueprintsService.getAll()
  // Expecting API returns array of {author, name, points}
  const authors = [...new Set(data.map((bp) => bp.author))]
  return authors
})

export const fetchByAuthor = createAsyncThunk('blueprints/fetchByAuthor', async (author) => {
  const items = await blueprintsService.getByAuthor(author)
  return { author, items }
})

export const fetchBlueprint = createAsyncThunk(
  'blueprints/fetchBlueprint',
  async ({ author, name }) => {
    const data = await blueprintsService.getByAuthorAndName(author, name)
    return data
  },
)

export const createBlueprint = createAsyncThunk('blueprints/createBlueprint', async (payload) => {
  const data = await blueprintsService.create(payload)
  return data
})

// Cada thunk tiene su propio status/error, asi un fallo al abrir un plano
// no borra ni tapa el estado de la lista (y cada zona de la UI puede reintentar lo suyo).
const REQUESTS = ['authors', 'byAuthor', 'current', 'create']
const byRequest = (value) => Object.fromEntries(REQUESTS.map((key) => [key, value]))

const start = (s, key) => {
  s.status[key] = 'loading'
  s.error[key] = null
}
const succeed = (s, key) => {
  s.status[key] = 'succeeded'
}
const fail = (s, key, a) => {
  s.status[key] = 'failed'
  s.error[key] = a.error.message
}

const slice = createSlice({
  name: 'blueprints',
  initialState: {
    authors: [],
    byAuthor: {},
    current: null,
    status: byRequest('idle'),
    error: byRequest(null),
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthors.pending, (s) => start(s, 'authors'))
      .addCase(fetchAuthors.fulfilled, (s, a) => {
        succeed(s, 'authors')
        s.authors = a.payload
      })
      .addCase(fetchAuthors.rejected, (s, a) => fail(s, 'authors', a))
      .addCase(fetchByAuthor.pending, (s) => start(s, 'byAuthor'))
      .addCase(fetchByAuthor.fulfilled, (s, a) => {
        succeed(s, 'byAuthor')
        // Defensa extra: si por algun motivo no llega un array, no rompemos la UI
        s.byAuthor[a.payload.author] = Array.isArray(a.payload.items) ? a.payload.items : []
      })
      .addCase(fetchByAuthor.rejected, (s, a) => fail(s, 'byAuthor', a))
      .addCase(fetchBlueprint.pending, (s) => start(s, 'current'))
      .addCase(fetchBlueprint.fulfilled, (s, a) => {
        succeed(s, 'current')
        s.current = a.payload
      })
      .addCase(fetchBlueprint.rejected, (s, a) => fail(s, 'current', a))
      .addCase(createBlueprint.pending, (s) => start(s, 'create'))
      .addCase(createBlueprint.fulfilled, (s, a) => {
        succeed(s, 'create')
        const bp = a.payload
        if (s.byAuthor[bp.author]) s.byAuthor[bp.author].push(bp)
      })
      .addCase(createBlueprint.rejected, (s, a) => fail(s, 'create', a))
  },
})

export default slice.reducer
