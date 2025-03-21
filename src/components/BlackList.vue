<template>
  <div class="blacklist-container">
    <a-space style="margin-bottom: 16px">
      <a-input-search
        v-model:value="searchQuery"
        placeholder="搜索黑名单用户"
        style="width: 200px"
        @search="handleSearch"
        :loading="searchLoading"
      />
      <a-button @click="refreshData">
        <template #icon><ReloadOutlined /></template>
      </a-button>
      <a-button type="primary" @click="showAddModal">添加</a-button>
    </a-space>
    <a-table
      :columns="columns"
      :data-source="blacklist"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      @change="handleTableChange"
      :scroll="{ x: 800, y: 500 }"
    >
      <template #emptyText>
        <a-empty description="暂无数据" v-if="!loading">
          <template #description>
            <span>{{ blacklist.length === 0 ? '当前没有黑名单用户' : '没有匹配的数据' }}</span>
          </template>
        </a-empty>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button size="small" danger @click="remove(record)">移除</a-button>
        </template>
      </template>
    </a-table>

    <!-- 添加黑名单弹窗 -->
    <a-modal
      v-model:open="addModalOpen"
      title="添加黑名单用户"
      @ok="handleAddOk"
      :confirm-loading="addLoading"
    >
      <a-form :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="用户ID" required>
          <a-input v-model:value="newUserId" placeholder="请输入用户ID" />
        </a-form-item>
        <a-form-item label="原因" required>
          <a-input v-model:value="newReason" placeholder="请输入添加原因" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { message } from 'ant-design-vue'
import { ReloadOutlined } from '@ant-design/icons-vue'

// 状态变量
const searchQuery = ref('')
const blacklist = ref([])
const loading = ref(false)
const searchLoading = ref(false)
const addModalOpen = ref(false)
const addLoading = ref(false)
const newUserId = ref('')
const newReason = ref('')
const totalCount = ref(0)

// 分页配置
const pagination = ref({
  pageSize: 10,
  total: 0,
  current: 1,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条记录`,
})

// 表格列定义
const columns = [
  {
    title: '用户',
    dataIndex: 'user',
    key: 'user',
    width: 200,
  },
  {
    title: '原因',
    dataIndex: 'reason',
    key: 'reason',
    ellipsis: true,
    width: 300,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
]

// API请求方法 - 获取黑名单数据
const fetchBlacklist = async (page = 1, pageSize = pagination.value.pageSize) => {
  loading.value = true
  try {
    const offset = (page - 1) * pageSize
    const params = {
      search: searchQuery.value || undefined,
      limit: pageSize,
      offset: offset,
    }

    const response = await axios.get('/api/blacklist', { params })

    if (response.data && Array.isArray(response.data.records)) {
      blacklist.value = response.data.records
      totalCount.value = response.data.total || 0
      pagination.value.total = totalCount.value
      pagination.value.current = page
      pagination.value.pageSize = pageSize
    } else {
      throw new Error('返回数据格式不正确')
    }
  } catch (error) {
    message.error(`获取黑名单失败: ${error.response?.data?.message || error.message || '未知错误'}`)
    blacklist.value = []
    totalCount.value = 0
    pagination.value.total = 0
  } finally {
    loading.value = false
  }
}

// 搜索按钮点击
const handleSearch = async () => {
  searchLoading.value = true
  try {
    await fetchBlacklist(1)
  } finally {
    searchLoading.value = false
  }
}

// 表格分页变化（移除排序逻辑）
const handleTableChange = (pag) => {
  const currentPage = pag.current
  const pageSize = pag.pageSize
  fetchBlacklist(currentPage, pageSize)
}

// 刷新数据
const refreshData = () => {
  fetchBlacklist(pagination.value.current)
}

// 显示添加弹窗
const showAddModal = () => {
  newUserId.value = ''
  newReason.value = ''
  addModalOpen.value = true
}

// 添加黑名单确认
const handleAddOk = async () => {
  if (!newUserId.value || !newReason.value) {
    message.warning('请填写用户ID和原因')
    return
  }

  addLoading.value = true
  try {
    const response = await axios.post('/api/blacklist', {
      userId: newUserId.value,
      reason: newReason.value,
    })

    if (response.data.success) {
      message.success(`已添加用户 ${newUserId.value}`)
      addModalOpen.value = false
      fetchBlacklist(pagination.value.current)
    } else {
      throw new Error(response.data.message || '添加失败')
    }
  } catch (error) {
    message.error(`添加黑名单失败: ${error.response?.data?.message || error.message || '未知错误'}`)
  } finally {
    addLoading.value = false
  }
}

// 移除黑名单
const remove = async (record) => {
  try {
    const response = await axios.delete(`/api/blacklist/${record.id}`)

    if (response.data.success) {
      message.success(`已移除用户 ${record.user} 从黑名单`)
      fetchBlacklist(pagination.value.current)
    } else {
      throw new Error(response.data.message || '移除失败')
    }
  } catch (error) {
    message.error(`移除黑名单失败: ${error.response?.data?.message || error.message || '未知错误'}`)
  }
}

// 初始化加载
onMounted(() => {
  fetchBlacklist()
})
</script>

<style scoped>
.blacklist-container {
  margin: 0;
  padding: 0;
}
</style>
