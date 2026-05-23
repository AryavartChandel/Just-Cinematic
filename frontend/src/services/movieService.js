import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export const getMovies = async (params = {}) => {
  const response = await api.get('/movies', { params })
  return response.data
}

export const createMovie = async (movie) => {
  const response = await api.post('/movies', movie)
  return response.data
}

export const updateMovie = async (id, movie) => {
  const response = await api.patch(`/movies/${id}`, movie)
  return response.data
}
export const toggleWatchStatus = async (
  id,
  updates
) => {
  const response = await api.patch(
    `/movies/${id}`,
    updates
  )

  return response.data
}
export const deleteMovie = async (id) => {
  const response = await api.delete(`/movies/${id}`)
  return response.data
}
