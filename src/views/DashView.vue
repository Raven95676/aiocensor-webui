<template>
  <a-layout class="full-layout">
    <a-layout-sider v-model:collapsed="collapsed" collapsible theme="dark" :width="200">
      <div class="logo">
        <span class="logo-text" :class="{ 'logo-collapsed': collapsed }">AIOCENSOR</span>
      </div>
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
        <a-menu-item key="/audit">
          <audit-outlined />
          <span><router-link to="/audit">审核日志</router-link></span>
        </a-menu-item>
        <a-menu-item key="/blacklist">
          <block-outlined />
          <span><router-link to="/blacklist">黑名单管理</router-link></span>
        </a-menu-item>
        <a-menu-item key="/sensitive">
          <warning-outlined />
          <span><router-link to="/sensitive">敏感词管理</router-link></span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="header">
        <div class="header-right">
          <a-dropdown>
            <a class="user-dropdown">
              <user-outlined /> 管理员
              <down-outlined />
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item key="logout" @click="handleLogout">
                  <logout-outlined /> 退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view v-if="isChildRoute" />
        <div v-else class="welcome-container">
          <a-row justify="center" align="middle" class="welcome-content">
            <a-col :span="24" class="text-center">
              <h1>欢迎使用AIOCENSOR</h1>
              <a-space direction="vertical" :size="16">
                <p>当前日期: {{ currentDate }}</p>
                <a-space>
                  <a-button type="primary" @click="goTo('/audit')">审核日志</a-button>
                  <a-button type="primary" @click="goTo('/blacklist')">黑名单管理</a-button>
                  <a-button type="primary" @click="goTo('/sensitive')">敏感词管理</a-button>
                </a-space>
              </a-space>
            </a-col>
          </a-row>
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  AuditOutlined,
  BlockOutlined,
  WarningOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'

const collapsed = ref(false)
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const currentDate = ref(new Date().toLocaleString())

// 自动更新日期
let dateUpdater = null

const selectedKeys = computed(() => [route.path || '/audit'])
const isChildRoute = computed(() => route.path !== '/' && route.path !== '')
const goTo = (path) => router.push(path)

const handleLogout = () => {
  Modal.confirm({
    title: '确认退出',
    content: '您确定要退出登录吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      authStore.logout()
      router.push('/login')
    },
  })
}

onMounted(() => {
  currentDate.value = new Date().toLocaleString()
  dateUpdater = setInterval(() => {
    currentDate.value = new Date().toLocaleString()
  }, 60000)
})

onUnmounted(() => {
  if (dateUpdater) {
    clearInterval(dateUpdater)
  }
})
</script>

<style scoped>
.full-layout {
  height: 100vh;
  width: 100vw;
  position: fixed;
}

.logo {
  height: 32px;
  margin: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  color: #fff;
  font-weight: bold;
  font-size: 18px;
  transition: all 0.3s;
}

.logo-collapsed {
  font-size: 0;
}

.header {
  background: #fff;
  padding: 0 16px;
  height: 64px;
  line-height: 64px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end;
}

.header-right {
  height: 100%;
  display: flex;
  align-items: center;
}

.user-dropdown {
  cursor: pointer;
  padding: 0 12px;
  color: rgba(0, 0, 0, 0.65);
}

.content {
  padding: 16px;
  background: #fff;
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.welcome-container,
.welcome-content {
  height: 100%;
}

.text-center {
  text-align: center;
}

:deep(.ant-layout-sider) {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 999;
  height: 100vh;
}

:deep(.ant-menu-item a) {
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
}

:deep(.ant-menu-item-selected a) {
  color: #fff;
}

:deep(.ant-layout) {
  margin-left: 200px;
  transition: margin-left 0.2s;
}

:deep(.ant-layout-sider-collapsed) + .ant-layout {
  margin-left: 80px;
}
</style>
