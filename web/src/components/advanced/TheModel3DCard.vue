<template>
  <div class="model-viewer-container rounded-lg overflow-hidden relative">
    <!-- 右上角标签 -->
    <div class="absolute top-2 right-2 z-10 border-0">
      <!-- 模型类型标签 -->
      <span class="model-type-badge">
        {{ modelType }}
      </span>
    </div>
    
    <model-viewer
      :src="modelUrl"
      :alt="alt"
      auto-rotate
      camera-controls
      shadow-intensity="0"
      exposure="1"
      class="w-full h-64 sm:h-80"
      :poster="poster"
      loading="lazy"
      reveal="auto"
    >
    </model-viewer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelSrc: string
  alt?: string
  poster?: string
}>()

const envURL = import.meta.env.VITE_SERVICE_BASE_URL as string
const backendURL = envURL.endsWith('/') ? envURL.slice(0, -1) : envURL

// 处理模型URL，如果是相对路径则拼接后端地址
const modelUrl = computed(() => {
  if (props.modelSrc.startsWith('http://') || props.modelSrc.startsWith('https://')) {
    return props.modelSrc
  }
  return `${backendURL}/api${props.modelSrc}`
})

const alt = computed(() => props.alt || '3D Model')

// 获取模型类型（从文件扩展名）
const modelType = computed(() => {
  const src = props.modelSrc.toLowerCase()
  if (src.endsWith('.glb')) return 'GLB'
  if (src.endsWith('.gltf')) return 'GLTF'
  return '3D'
})
</script>

<style scoped>
model-viewer {
  --poster-color: transparent;
  background-color: transparent;
}

.model-viewer-container {
  background-color: transparent;
}

/* 模型类型标签 - 使用更高优先级 */
.model-viewer-container .model-type-badge {
  padding: 4px 10px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  border-radius: 6px !important;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4) !important;
  display: inline-block !important;
  line-height: 1.2 !important;
}
</style>
