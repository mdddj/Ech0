<template>
  <PanelCard>
    <!-- Ech0 Connect设置 -->
    <div class="w-full">
      <div class="flex flex-row items-center justify-between mb-3">
        <h1 class="text-[var(--text-color-600)] font-bold text-lg">Ech0 Connect</h1>
        <div class="flex flex-row items-center justify-end gap-2">
          <!-- 检测健康状态按钮 -->
          <button
            v-if="!connectsEdit && connects.length > 0"
            @click="handleCheckHealth"
            :disabled="isChecking"
            class="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="检测连接状态"
          >
            {{ isChecking ? '检测中...' : '检测状态' }}
          </button>
          <!-- 清理失效连接按钮 -->
          <button
            v-if="!connectsEdit && connects.length > 0 && hasInvalidConnects"
            @click="handleCleanInvalid"
            :disabled="isCleaning"
            class="px-3 py-1 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="清理失效连接"
          >
            {{ isCleaning ? '清理中...' : '清理失效' }}
          </button>
          <!-- 编辑按钮 -->
          <button @click="connectsEdit = !connectsEdit" title="编辑">
            <Edit
              v-if="!connectsEdit"
              class="w-5 h-5 text-[var(--text-color-400)] hover:w-6 hover:h-6"
            />
            <Close v-else class="w-5 h-5 text-[var(--text-color-400)] hover:w-6 hover:h-6" />
          </button>
        </div>
      </div>

      <!-- 添加 Connect -->
      <div v-if="connectsEdit" class="text-[var(--text-color-next-500)] mb-2">
        <div class="flex items-center gap-2">
          <BaseInput
            v-model="connectUrl"
            type="text"
            placeholder="请输入 Connect 地址（带https/http）"
            class="flex-1 h-8"
          />
          <BaseButton
            :icon="Publish"
            @click="handleAddConnect"
            class="w-8 h-8 rounded-md"
            title="连接"
          />
        </div>
      </div>

      <!-- Connect 列表 -->
      <div v-else>
        <div v-if="connects.length === 0" class="flex flex-col items-center justify-center mt-2">
          <span class="text-[var(--text-color-next-400)]">暂无连接...</span>
        </div>

        <div v-else class="mt-2 overflow-x-auto border border-[var(--border-color-300)] rounded-lg">
          <table class="min-w-full divide-y divide-[var(--divide-color-200)]">
            <thead>
              <tr class="bg-[var(--bg-color-50)] opacity-70">
                <th
                  class="px-3 py-2 text-left text-sm font-semibold text-[var(--text-color-next-600)]"
                >
                  #
                </th>
                <th
                  class="px-3 py-2 text-left text-sm font-semibold text-[var(--text-color-next-600)]"
                >
                  Connect 地址
                </th>
                <th
                  class="px-3 py-2 text-left text-sm font-semibold text-[var(--text-color-next-600)]"
                >
                  状态
                </th>
                <th
                  class="px-3 min-w-18 py-2 text-right text-sm font-semibold text-[var(--text-color-next-600)]"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--divide-color-100)] text-nowrap">
              <tr v-for="(connect, index) in connects" :key="connect.id">
                <td class="px-3 py-2 text-sm text-[var(--text-color-next-700)]">{{ index + 1 }}</td>
                <td
                  class="px-3 py-2 text-sm text-[var(--text-color-next-700)] font-mono truncate max-w-xs"
                  :title="connect.connect_url"
                >
                  {{ connect.connect_url }}
                </td>
                <td class="px-3 py-2 text-sm">
                  <span
                    v-if="healthStatus[connect.id]"
                    :class="[
                      'px-2 py-1 rounded text-xs font-medium',
                      healthStatus[connect.id].is_healthy
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700',
                    ]"
                    :title="healthStatus[connect.id].message"
                  >
                    {{ healthStatus[connect.id].is_healthy ? '✓ 正常' : '✗ 失效' }}
                  </span>
                  <span v-else class="text-gray-400 text-xs">未检测</span>
                </td>
                <td class="px-3 py-2 text-right">
                  <button
                    class="p-1 hover:bg-[var(--bg-color-100)] rounded"
                    @click="handleDisconnect(connect.id)"
                    title="断开连接"
                  >
                    <Disconnect class="w-5 h-5 text-red-500" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import PanelCard from '@/layout/PanelCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import Edit from '@/components/icons/edit.vue'
import Disconnect from '@/components/icons/disconnect.vue'
import Close from '@/components/icons/close.vue'
import Publish from '@/components/icons/publish.vue'
import { ref, onMounted, computed } from 'vue'
import {
  fetchAddConnect,
  fetchDeleteConnect,
  fetchCheckConnectsHealth,
  fetchCleanInvalidConnects,
} from '@/service/api'
import { theToast } from '@/utils/toast'

import { useConnectStore } from '@/stores'
import { storeToRefs } from 'pinia'

import { useBaseDialog } from '@/composables/useBaseDialog'
const { openConfirm } = useBaseDialog()

const connectStore = useConnectStore()
const { getConnect } = connectStore
const { connects } = storeToRefs(connectStore)
const connectsEdit = ref<boolean>(false)
const connectUrl = ref<string>('')

// 健康检测相关状态
const isChecking = ref<boolean>(false)
const isCleaning = ref<boolean>(false)
const healthStatus = ref<Record<number, App.Api.Connect.ConnectHealth>>({})

// 计算是否有失效连接
const hasInvalidConnects = computed(() => {
  return Object.values(healthStatus.value).some((status) => !status.is_healthy)
})

const handleAddConnect = async () => {
  if (connectUrl.value.length === 0) {
    theToast.error('请输入Connect地址')
    return
  }
  await fetchAddConnect(connectUrl.value).then((res) => {
    if (res.code === 1) {
      theToast.success(res.msg)
      connectUrl.value = ''
      getConnect()
      // 清空健康状态
      healthStatus.value = {}
    }
  })
}

const handleDisconnect = async (connect_id: number) => {
  // 弹出确认框
  openConfirm({
    title: '确定要断开连接吗？',
    description: '',
    onConfirm: async () => {
      await fetchDeleteConnect(connect_id).then((res) => {
        if (res.code === 1) {
          theToast.success(res.msg)
          getConnect()
          // 清除该连接的健康状态
          delete healthStatus.value[connect_id]
        }
      })
    },
  })
}

// 检测连接健康状态
const handleCheckHealth = async () => {
  if (isChecking.value) return

  isChecking.value = true
  try {
    const res = await fetchCheckConnectsHealth()
    if (res.code === 1 && res.data) {
      // 将数组转换为以 ID 为键的对象
      healthStatus.value = {}
      res.data.forEach((health) => {
        healthStatus.value[health.id] = health
      })
      theToast.success('检测完成')
    } else {
      theToast.error(res.msg || '检测失败')
    }
  } catch (error) {
    console.error('检测连接健康状态失败:', error)
    theToast.error('检测失败，请稍后重试')
  } finally {
    isChecking.value = false
  }
}

// 清理失效连接
const handleCleanInvalid = async () => {
  if (isCleaning.value) return

  openConfirm({
    title: '确定要清理所有失效连接吗？',
    description: '此操作将删除所有无法访问的连接，且无法恢复。',
    onConfirm: async () => {
      isCleaning.value = true
      try {
        const res = await fetchCleanInvalidConnects()
        if (res.code === 1) {
          const deletedCount = res.data?.deleted_count || 0
          theToast.success(`已清理 ${deletedCount} 个失效连接`)
          // 刷新连接列表
          await getConnect()
          // 清空健康状态
          healthStatus.value = {}
        } else {
          theToast.error(res.msg || '清理失败')
        }
      } catch (error) {
        console.error('清理失效连接失败:', error)
        theToast.error('清理失败，请稍后重试')
      } finally {
        isCleaning.value = false
      }
    },
  })
}

onMounted(() => {
  getConnect()
})
</script>

<style scoped></style>
