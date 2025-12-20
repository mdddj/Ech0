<template>
  <div class="px-9 md:px-11">
    <div
      class="widget rounded-md shadow-sm hover:shadow-md ring-1 ring-[var(--ring-color)] ring-inset p-4"
    >
      <h2 class="text-[var(--widget-title-color)] font-bold text-lg mb-3 flex items-center">
        <MonitorIcon class="mr-2 text-green-500" />
        <span>赛博监工</span>
        <span
          class="ml-2 text-xs px-2 py-0.5 rounded-full"
          :class="connected ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'"
        >
          {{ connected ? '在线' : '离线' }}
        </span>
      </h2>

      <!-- 事件列表 -->
      <div class="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
        <TransitionGroup name="event-list">
          <div
            v-for="event in events"
            :key="event.id || event.event_id"
            class="event-item flex items-start gap-2 p-2 rounded bg-[var(--bg-color-next)] text-sm"
          >
            <!-- 事件图标 -->
            <div class="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              <img
                v-if="getEventIcon(event)"
                :src="getEventIcon(event)"
                class="w-6 h-6 rounded"
                alt="app icon"
              />
              <span v-else class="text-base">{{ getEventEmoji(event) }}</span>
            </div>
            <!-- 事件内容 -->
            <div class="flex-1 min-w-0">
              <div class="text-[var(--text-color)] truncate max-w-[180px]" :title="getEventTitle(event)">
                {{ getEventTitle(event) }}
              </div>
              <div class="text-xs text-[var(--text-color-next-500)] truncate max-w-[180px]">
                {{ getEventDesc(event) }}
              </div>
            </div>
            <!-- 时间 -->
            <div class="flex-shrink-0 text-xs text-[var(--text-color-next-500)]">
              {{ formatTime(event.timestamp || event.timestamp_str) }}
            </div>
          </div>
        </TransitionGroup>

        <div v-if="events.length === 0 && !loading" class="text-center text-[var(--text-color-next-500)] text-sm py-4">
          今日暂无事件记录
        </div>
        <div v-if="loading" class="text-center text-[var(--text-color-next-500)] text-sm py-4">
          加载中...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import MonitorIcon from '../icons/monitor.vue'
import { useSettingStore } from '@/stores/setting'
import { storeToRefs } from 'pinia'

// 从系统设置获取配置
const settingStore = useSettingStore()
const { SystemSetting } = storeToRefs(settingStore)

// 动态计算 API 地址，支持 HTTPS 自动适配
const API_BASE = computed(() => {
  const url = SystemSetting.value.cyber_monitor_url || ''
  if (!url) return ''
  // 如果用户没有指定协议，根据当前页面协议自动选择
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const protocol = window.location.protocol === 'https:' ? 'https://' : 'http://'
    return protocol + url
  }
  return url
})

const WS_URL = computed(() => {
  const url = SystemSetting.value.cyber_monitor_url || ''
  if (!url) return ''
  // 移除 http(s):// 前缀，添加 ws(s)://
  const cleanUrl = url.replace(/^https?:\/\//, '')
  const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
  return wsProtocol + cleanUrl + '/ws'
})

interface EventData {
  id?: number
  event_id?: string
  event_type?: string
  eventType?: string
  timestamp?: number
  timestamp_str?: string
  timestampStr?: string
  device_id?: string
  deviceId?: string
  data?: {
    type?: string
    data?: Record<string, unknown>
  }
}

const events = ref<EventData[]>([])
const connected = ref(false)
const loading = ref(true)
let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

// 获取今日事件
async function fetchTodayEvents() {
  if (!API_BASE.value) return
  try {
    const res = await fetch(`${API_BASE.value}/api/events`)
    const result = await res.json()
    if (result.success && result.data) {
      // 按时间倒序，最新的在前面
      events.value = result.data.sort((a: EventData, b: EventData) => 
        (b.timestamp || 0) - (a.timestamp || 0)
      ).slice(0, 50) // 只保留最近50条
    }
  } catch (e) {
    console.error('获取事件失败:', e)
  }
}

// WebSocket 连接
function connectWS() {
  if (!WS_URL.value) return
  if (ws) {
    ws.close()
  }

  try {
    ws = new WebSocket(WS_URL.value)

    ws.onopen = () => {
      connected.value = true
      console.log('赛博监工 WebSocket 已连接')
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        // 跳过欢迎消息
        if (data.type === 'welcome') {
          return
        }
        // 新事件入栈到顶部
        const newEvent: EventData = {
          event_id: data.eventId || `ws-${Date.now()}`,
          event_type: data.eventType,
          timestamp: data.timestamp,
          timestamp_str: data.timestampStr,
          device_id: data.deviceId,
          data: data.data
        }
        events.value.unshift(newEvent)
        // 保持列表不超过50条
        if (events.value.length > 50) {
          events.value.pop()
        }
      } catch (err) {
        console.error('解析 WebSocket 消息失败:', err)
      }
    }

    ws.onclose = () => {
      connected.value = false
      console.log('赛博监工 WebSocket 已断开，5秒后重连...')
      reconnectTimer = setTimeout(connectWS, 5000)
    }

    ws.onerror = (err) => {
      console.error('WebSocket 错误:', err)
    }
  } catch (err) {
    console.error('WebSocket 连接失败:', err)
    connected.value = false
  }
}

// 事件类型处理
function getEventType(event: EventData): string {
  return event.event_type || event.eventType || event.data?.type || 'unknown'
}

function getEventEmoji(event: EventData): string {
  const type = getEventType(event)
  const emojiMap: Record<string, string> = {
    'app_foreground_changed': '🔄',
    'foregroundChange': '🔄',
    'notification_received': '🔔',
    'notification': '🔔',
    'app_launched': '🚀',
    'app_terminated': '❌',
    'app': '📱',
    'power_connected': '🔌',
    'power_disconnected': '🔋',
    'battery_level_changed': '🔋',
    'battery': '🔋',
    'system_sleep': '😴',
    'system_wake': '☀️',
    'system_boot': '🖥️',
    'system_shutdown': '⏹️',
  }
  return emojiMap[type] || '📌'
}

function getEventIcon(event: EventData): string | null {
  const innerData = event.data?.data as Record<string, unknown> | undefined
  if (!innerData) return null
  
  const icon = innerData.toAppIcon || innerData.appIcon || innerData.app_icon
  if (icon && typeof icon === 'string') {
    return `data:image/png;base64,${icon}`
  }
  return null
}

function getEventTitle(event: EventData): string {
  const type = getEventType(event)
  const innerData = event.data?.data as Record<string, unknown> | undefined

  if (type === 'app_foreground_changed' || type === 'foregroundChange') {
    return `切换到 ${innerData?.toApp || '未知应用'}`
  }
  if (type === 'notification_received' || type === 'notification') {
    return `${innerData?.appName || '通知'}: ${innerData?.title || ''}`
  }
  if (type === 'app_launched') {
    return `启动 ${innerData?.appName || '应用'}`
  }
  if (type === 'app_terminated') {
    return `关闭 ${innerData?.appName || '应用'}`
  }
  if (type === 'battery_level_changed' || type === 'battery') {
    return `电量 ${innerData?.level || 0}%`
  }
  if (type === 'power_connected') {
    return '电源已连接'
  }
  if (type === 'power_disconnected') {
    return '电源已断开'
  }
  if (type === 'system_sleep') {
    return '系统休眠'
  }
  if (type === 'system_wake') {
    return '系统唤醒'
  }
  return type
}

function getEventDesc(event: EventData): string {
  const type = getEventType(event)
  const innerData = event.data?.data as Record<string, unknown> | undefined

  if (type === 'app_foreground_changed' || type === 'foregroundChange') {
    const source = innerData?.triggerSource as string
    const sourceMap: Record<string, string> = {
      'dock_click': '点击 Dock',
      'cmd_tab': 'Cmd+Tab',
      'mission_control': '调度中心',
      'spotlight': 'Spotlight',
      'notification_click': '点击通知',
    }
    return sourceMap[source] || source || ''
  }
  if (type === 'notification_received' || type === 'notification') {
    return (innerData?.body as string) || ''
  }
  if (type === 'battery_level_changed' || type === 'battery') {
    const charging = innerData?.isCharging ? '充电中' : '未充电'
    return charging
  }
  return ''
}

function formatTime(ts: number | string | undefined): string {
  if (!ts) return ''
  let date: Date
  if (typeof ts === 'number') {
    date = new Date(ts * 1000)
  } else {
    date = new Date(ts)
  }
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  loading.value = true
  await fetchTodayEvents()
  loading.value = false
  connectWS()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }
})
</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: var(--border-color-400);
  border-radius: 2px;
}

/* 列表动画 */
.event-list-enter-active {
  animation: slideIn 0.3s ease-out;
}

.event-list-leave-active {
  animation: slideOut 0.2s ease-in;
}

.event-list-move {
  transition: transform 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(20px);
  }
}

/* 新事件高亮 */
.event-item {
  transition: background-color 0.3s ease;
}

.event-list-enter-from .event-item {
  background-color: var(--ring-color);
}
</style>
