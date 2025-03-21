<template>
  <div class="sensitive-word-container">
    <a-space style="margin-bottom: 16px">
      <a-input-search
        v-model:value="searchQuery"
        placeholder="搜索敏感词"
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
      :data-source="sensitiveWords"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      @change="handleTableChange"
      :scroll="{ x: 600, y: 500 }"
    >
      <template #emptyText>
        <a-empty description="暂无数据" v-if="!loading">
          <template #description>
            <span>{{ sensitiveWords.length === 0 ? '当前没有敏感词' : '没有匹配的数据' }}</span>
          </template>
        </a-empty>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button size="small" danger @click="remove(record)">移除</a-button>
        </template>
      </template>
    </a-table>

    <!-- 添加敏感词弹窗 -->
    <a-modal
      v-model:open="addModalOpen"
      title="添加敏感词"
      @ok="handleAddOk"
      :confirm-loading="addLoading"
    >
      <a-form :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="敏感词" required>
          <a-input v-model:value="newWord" placeholder="请输入敏感词" />
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
const sensitiveWords = ref([])
const loading = ref(false)
const searchLoading = ref(false)
const addModalOpen = ref(false)
const addLoading = ref(false)
const newWord = ref('')
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

// 表格列定义（移除 ID 和 sorter）
const columns = [
  {
    title: '敏感词',
    dataIndex: 'word',
    key: 'word',
    width: 300,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
]

// API请求方法 - 获取敏感词数据
const fetchSensitiveWords = async (page = 1, pageSize = pagination.value.pageSize) => {
  loading.value = true
  try {
    const offset = (page - 1) * pageSize
    const params = {
      search: searchQuery.value || undefined,
      limit: pageSize,
      offset: offset,
    }

    const response = await axios.get('/api/sensitive-words', { params })

    if (response.data && Array.isArray(response.data.words)) {
      sensitiveWords.value = response.data.words
      totalCount.value = response.data.total || 0
      pagination.value.total = totalCount.value
      pagination.value.current = page
      pagination.value.pageSize = pageSize
    } else {
      throw new Error('返回数据格式不正确')
    }
  } catch (error) {
    message.error(`获取敏感词失败: ${error.response?.data?.message || error.message || '未知错误'}`)
    sensitiveWords.value = []
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
    await fetchSensitiveWords(1)
  } finally {
    searchLoading.value = false
  }
}

// 表格分页变化（移除排序逻辑）
const handleTableChange = (pag) => {
  const currentPage = pag.current
  const pageSize = pag.pageSize
  fetchSensitiveWords(currentPage, pageSize)
}

// 刷新数据
const refreshData = () => {
  fetchSensitiveWords(pagination.value.current)
}

// 显示添加弹窗
const showAddModal = () => {
  newWord.value = ''
  addModalOpen.value = true
}

// 添加敏感词确认
const handleAddOk = async () => {
  if (!newWord.value) {
    message.warning('请输入敏感词')
    return
  }

  addLoading.value = true
  try {
    const response = await axios.post('/api/sensitive-words', {
      word: newWord.value,
    })

    if (response.data.success) {
      message.success(`已添加敏感词 ${newWord.value}`)
      addModalOpen.value = false
      fetchSensitiveWords(pagination.value.current)
    } else {
      throw new Error(response.data.message || '添加失败')
    }
  } catch (error) {
    message.error(`添加敏感词失败: ${error.response?.data?.message || error.message || '未知错误'}`)
  } finally {
    addLoading.value = false
  }
}

// 移除敏感词
const remove = async (record) => {
  try {
    const response = await axios.delete(`/api/sensitive-words/${record.id}`)

    if (response.data.success) {
      message.success(`已移除敏感词 ${record.word}`)
      fetchSensitiveWords(pagination.value.current)
    } else {
      throw new Error(response.data.message || '移除失败')
    }
  } catch (error) {
    message.error(`移除敏感词失败: ${error.response?.data?.message || error.message || '未知错误'}`)
  }
}

// 初始化加载
onMounted(() => {
  fetchSensitiveWords()
})
</script>

<style scoped>
.sensitive-word-container {
  margin: 0;
  padding: 0;
}
</style>
