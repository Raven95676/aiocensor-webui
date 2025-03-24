<template>
  <div class="audit-container">
    <a-space style="margin-bottom: 16px">
      <a-input-search
        v-model:value="searchQuery"
        placeholder="搜索内容"
        style="width: 200px"
        @search="handleSearch"
        :loading="searchLoading"
      />
      <a-button @click="refreshData">
        <template #icon><ReloadOutlined /></template>
      </a-button>
    </a-space>
    <a-table
      :columns="columns"
      :data-source="logs"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      @change="handleTableChange"
      :scroll="{ x: 1000, y: 500 }"
    >
      <template #emptyText>
        <a-empty description="暂无数据" v-if="!loading">
          <template #description>
            <span>{{ logs.length === 0 ? '今天没有待处理的事务呢' : '没有匹配的数据' }}</span>
          </template>
        </a-empty>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'content'">
          <a-tooltip
            :title="isTextContent(record.content) ? record.content : '点击查看图片'"
            placement="topLeft"
          >
            <div class="ellipsis-cell">
              <span v-if="isTextContent(record.content)">{{ record.content }}</span>
              <a v-else @click="showImageModal(record.content)">[点击查看图片]</a>
            </div>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'systemJudgment'">
          <a-tag :color="getJudgmentColor(record.systemJudgment)">
            {{ record.systemJudgment }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="primary" size="small" @click="handleDispose(record)">处置</a-button>
            <a-button size="small" @click="ignore(record)">忽略</a-button>
          </a-space>
        </template>
      </template>
    </a-table>
    <a-modal
      v-model:open="disposeModalOpen"
      title="处置操作"
      @ok="handleDisposeOk"
      :ok-button-props="{ disabled: selectedActions.length === 0 }"
      :confirm-loading="disposeLoading"
    >
      <p>
        对消息：<a-typography-text strong>{{ currentRecord?.id }}</a-typography-text> 进行处置
      </p>
      <a-checkbox-group v-model:value="selectedActions">
        <a-row>
          <a-col :span="24">
            <a-tooltip
              :title="
                !currentRecord?.source?.includes('aiocqhttp') ? '操作仅在aiocqhttp平台可用' : ''
              "
            >
              <a-checkbox value="dispose" :disabled="!currentRecord?.source?.includes('aiocqhttp')">
                处置
              </a-checkbox>
            </a-tooltip>
          </a-col>
          <a-col :span="24">
            <a-checkbox value="block">拉黑</a-checkbox>
          </a-col>
        </a-row>
      </a-checkbox-group>
    </a-modal>

    <!-- 图片预览弹窗 -->
    <a-modal v-model:open="imageModalOpen" title="查看图片" :footer="null" :width="800">
      <img :src="currentImage" style="width: 100%; height: auto" />
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
const logs = ref([])
const loading = ref(false)
const searchLoading = ref(false)
const disposeModalOpen = ref(false)
const disposeLoading = ref(false)
const selectedActions = ref([])
const currentRecord = ref(null)
const totalCount = ref(0)
const imageModalOpen = ref(false)
const currentImage = ref('')

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
    title: '内容',
    dataIndex: 'content',
    key: 'content',
    ellipsis: true,
    width: 300,
  },
  {
    title: '用户ID',
    dataIndex: 'user_id',
    key: 'user_id',
    width: 100,
  },
  {
    title: '来源',
    dataIndex: 'source',
    key: 'source',
    width: 100,
  },
  {
    title: '系统判断',
    dataIndex: 'systemJudgment',
    key: 'systemJudgment',
    width: 100,
  },
  {
    title: '原因',
    dataIndex: 'reason',
    key: 'reason',
    ellipsis: true,
    width: 150,
  },
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
]

// 判断内容是否为文本（非 Base64）
const isTextContent = (content) => {
  return !content.startsWith('data:image/')
}

// 获取判断类型的颜色
const getJudgmentColor = (judgment) => {
  const colors = {
    Pass: 'green',
    Review: 'orange',
    Block: 'red',
  }
  return colors[judgment] || 'blue'
}

// 显示图片预览弹窗
const showImageModal = (base64) => {
  currentImage.value = base64
  imageModalOpen.value = true
}

// API请求方法 - 获取日志数据
const fetchLogs = async (page = 1, pageSize = pagination.value.pageSize) => {
  loading.value = true
  try {
    const offset = (page - 1) * pageSize
    const params = {
      search: searchQuery.value || undefined,
      limit: pageSize,
      offset: offset,
    }

    const response = await axios.get('/api/audit-logs', { params })

    if (response.data && Array.isArray(response.data.logs)) {
      logs.value = response.data.logs
      totalCount.value = response.data.total || 0
      pagination.value.total = totalCount.value
      pagination.value.current = page
      pagination.value.pageSize = pageSize
    } else {
      throw new Error('返回数据格式不正确')
    }
  } catch (error) {
    message.error(`获取日志失败: ${error.response?.data?.message || error.message || '未知错误'}`)
    logs.value = []
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
    await fetchLogs(1)
  } finally {
    searchLoading.value = false
  }
}

// 表格分页变化
const handleTableChange = (pag) => {
  const currentPage = pag.current
  const pageSize = pag.pageSize
  fetchLogs(currentPage, pageSize)
}

// 刷新数据
const refreshData = () => {
  fetchLogs(pagination.value.current)
}

// 处置弹窗
const handleDispose = (record) => {
  currentRecord.value = record
  selectedActions.value = []
  disposeModalOpen.value = true
}

// 处置确认
const handleDisposeOk = async () => {
  if (selectedActions.value.length === 0) return

  disposeLoading.value = true
  try {
    const response = await axios.post(`/api/audit-logs/${currentRecord.value.id}/dispose`, {
      actions: selectedActions.value,
    })

    if (response.data.success) {
      message.success(
        `已对消息 ${currentRecord.value.id} 执行${selectedActions.value.join('、')}操作`,
      )
      disposeModalOpen.value = false
      fetchLogs(pagination.value.current)
    } else {
      throw new Error(response.data.message || '处置操作失败')
    }
  } catch (error) {
    message.error(`处置操作失败: ${error.response?.data?.message || error.message || '未知错误'}`)
  } finally {
    disposeLoading.value = false
  }
}

// 忽略操作
const ignore = async (record) => {
  try {
    const response = await axios.post(`/api/audit-logs/${record.id}/ignore`)

    if (response.data.success) {
      message.success(`已忽略消息 ${record.id}`)
      fetchLogs(pagination.value.current)
    } else {
      throw new Error(response.data.message || '忽略操作失败')
    }
  } catch (error) {
    message.error(`忽略操作失败: ${error.response?.data?.message || error.message || '未知错误'}`)
  }
}

// 初始化加载
onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.audit-container {
  margin: 0;
  padding: 0;
}

.ellipsis-cell {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
