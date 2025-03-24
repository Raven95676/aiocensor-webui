import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const storedAuth = localStorage.getItem('auth')
  const initialState = storedAuth
    ? JSON.parse(storedAuth)
    : { isAuthenticated: false, accessToken: null, refreshToken: null }

  const state = ref(initialState)

  // Add a flag to prevent refresh loops
  const isRefreshing = ref(false)

  const login = async (password) => {
    try {
      const response = await axios.post('/api/login', { password })
      if (response.data.success) {
        state.value.isAuthenticated = true
        state.value.accessToken = response.data.access_token
        state.value.refreshToken = response.data.refresh_token
        localStorage.setItem('auth', JSON.stringify(state.value))
        return { success: true }
      }
      return { success: false, message: response.data.message }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: '登录请求失败，请检查网络或稍后再试' }
    }
  }

  const logout = () => {
    state.value.isAuthenticated = false
    state.value.accessToken = null
    state.value.refreshToken = null
    localStorage.removeItem('auth')
  }

  const checkAuth = () => {
    const storedAuth = localStorage.getItem('auth')
    if (storedAuth) {
      const authData = JSON.parse(storedAuth)
      state.value = authData
      return authData.isAuthenticated
    }
    return false
  }

  const refreshToken = async () => {
    // Prevent concurrent refresh attempts
    if (isRefreshing.value) return false
    
    isRefreshing.value = true
    try {
      const response = await axios.post('/api/refresh', { refresh_token: state.value.refreshToken })
      if (response.data.success) {
        state.value.accessToken = response.data.access_token
        state.value.refreshToken = response.data.refresh_token
        localStorage.setItem('auth', JSON.stringify(state.value))
        return true
      }
      logout()
      return false
    } catch {
      logout()
      return false
    } finally {
      isRefreshing.value = false
    }
  }

  axios.interceptors.request.use(
    async (config) => {
      if (state.value.accessToken) {
        const payload = JSON.parse(atob(state.value.accessToken.split('.')[1]))
        const exp = payload.exp
        const now = Math.floor(Date.now() / 1000)
        if (exp - now < 60) {
          await refreshToken()
        }
        config.headers.Authorization = `Bearer ${state.value.accessToken}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && !isRefreshing.value) {
        // Try to refresh token, if fails then logout
        const refreshSuccess = await refreshToken()
        if (!refreshSuccess) {
          logout()
          // Redirect to login page
          window.location.href = '/#/login'
        }
      }
      return Promise.reject(error)
    },
  )

  return {
    state,
    login,
    logout,
    checkAuth,
    refreshToken,
  }
})
