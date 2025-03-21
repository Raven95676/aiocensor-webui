<template>
  <div class="login-container">
    <a-form :model="form" @finish="handleLogin" class="login-form">
      <h2 class="login-title">管理系统登录</h2>

      <div v-if="errorMessage" class="error-message">
        <a-alert :message="errorMessage" type="error" show-icon />
      </div>

      <a-form-item name="password" :rules="[{ required: true, message: '请输入密码' }]">
        <a-input-password
          v-model:value="form.password"
          placeholder="请输入密码"
          size="large"
          @keypress.enter="handleLogin"
        />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit" size="large" block :loading="loading">
          登录
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const form = ref({ password: '' })
const loading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  if (authStore.checkAuth()) {
    router.push('/')
  }
})

const handleLogin = async () => {
  if (!form.value.password) {
    errorMessage.value = '请输入密码'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const result = await authStore.login(form.value.password)
    if (result.success) {
      const redirectPath = route.query.redirect || '/'
      router.push(redirectPath)
    } else {
      errorMessage.value = result.message // 显示后端返回的具体错误
    }
  } catch (error) {
    console.error('Unexpected login error:', error)
    errorMessage.value = '登录时发生未知错误，请稍后再试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: fixed;
}

.login-form {
  width: 100%;
  max-width: 400px;
  padding: 32px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
  font-weight: 500;
}

.error-message {
  margin-bottom: 16px;
}
</style>
