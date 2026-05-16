import axios from 'axios'
import { env } from '@/core/config/env'

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export default httpClient
