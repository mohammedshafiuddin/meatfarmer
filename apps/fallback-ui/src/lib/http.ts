import webUiConstants from '@/constants'
import axios from 'axios'

export const httpClient = axios.create({
  baseURL: webUiConstants.baseUrl+'api',
  withCredentials: true
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('HTTP error', error)
    }
    return Promise.reject(error)
  }
)
