<template>
  <!-- Uppy Dashboard 容器 -->
  <div
    id="uppy-dashboard"
    class="rounded-md overflow-hidden shadow-inner ring-inset ring-1 ring-[var(--ring-color)]"
  ></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { getAuthToken } from '@/service/request/shared'
import { useUserStore, useEditorStore } from '@/stores'
import { theToast } from '@/utils/toast'
import { storeToRefs } from 'pinia'
import { ImageSource } from '@/enums/enums'
import { fetchGetPresignedUrl } from '@/service/api'

/* --------------- 与Uppy相关 ---------------- */
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import XHRUpload from '@uppy/xhr-upload'
import AwsS3 from '@uppy/aws-s3'
import '@uppy/core/css/style.min.css'
import '@uppy/dashboard/css/style.min.css'
import zh_CN from '@uppy/locales/lib/zh_CN'

let uppy: Uppy | null = null

const props = defineProps<{
  TheImageSource: string
}>()
// const emit = defineEmits(['uppyUploaded'])

const memorySource = ref<string>(props.TheImageSource) // 用于记住上传方式
const isUploading = ref<boolean>(false) // 是否正在上传
const files = ref<App.Api.Ech0.ImageToAdd[]>([]) // 已上传的文件列表
const tempFiles = ref<Map<string, { url: string; objectKey: string }>>(new Map()) // 用于S3临时存储文件回显地址的 Map(key: fileName, value: {url, objectKey})

const userStore = useUserStore()
const editorStore = useEditorStore()
const { isLogin } = storeToRefs(userStore)
const envURL = import.meta.env.VITE_SERVICE_BASE_URL as string
const backendURL = envURL.endsWith('/') ? envURL.slice(0, -1) : envURL

// ✨ 监听粘贴事件
const handlePaste = async (e: ClipboardEvent) => {
  if (!e.clipboardData) return

  for (const item of e.clipboardData.items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        const uniqueFile = new File([file], file.name, {
          type: file.type,
          lastModified: Date.now(),
        })

        uppy?.addFile({
          id: `pasted-image-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: uniqueFile.name,
          type: uniqueFile.type,
          data: uniqueFile,
          source: 'PastedImage',
        })
        uppy?.upload()
      }
    }
  }
}

// 初始化 Uppy 实例
const initUppy = () => {
  // 创建 Uppy 实例
  uppy = new Uppy({
    restrictions: {
      maxNumberOfFiles: 6,
      allowedFileTypes: ['image/*'],
    },
    autoProceed: true,
  })

  // 使用 Dashboard 插件
  uppy.use(Dashboard, {
    inline: true,
    target: '#uppy-dashboard',
    hideProgressDetails: false,
    hideUploadButton: false,
    hideCancelButton: false,
    hideRetryButton: false,
    hidePauseResumeButton: false,
    proudlyDisplayPoweredByUppy: false,
    height: 200,
    locale: zh_CN,
    note: '支持粘贴或选择图片上传哦！',
  })

  // 根据 props.TheImageSource 动态切换上传插件
  if (memorySource.value == ImageSource.LOCAL) {
    console.log('使用本地存储')
    uppy.use(XHRUpload, {
      endpoint: `${backendURL}/api/images/upload`, // 本地上传接口
      fieldName: 'file',
      formData: true,
      headers: {
        Authorization: `${getAuthToken()}`,
      },
    })
  } else if (memorySource.value == ImageSource.S3) {
    console.log('使用 S3 存储')
    uppy.use(AwsS3, {
      endpoint: '', // 走自定义的签名接口
      shouldUseMultipart: false, // 禁用分块上传
      // 每来一个文件都调用一次该函数，获取签名参数
      async getUploadParameters(file) {
        // console.log("Uploading to S3:", file)
        const fileName = file.name ? file.name : ''
        const contentType = file.type ? file.type : ''
        console.log('获取预签名fileName, contentType', fileName, contentType)

        const res = await fetchGetPresignedUrl(fileName, contentType)
        if (res.code !== 1) {
          throw new Error(res.msg || '获取预签名 URL 失败')
        }
        console.log('获取预签名成功!')
        const data = res.data as App.Api.Ech0.PresignResult
        tempFiles.value.set(data.file_name, { url: data.file_url, objectKey: data.object_key })
        return {
          method: 'PUT',
          url: data.presign_url, // 预签名 URL
          headers: {
            // 必须跟签名时的 Content-Type 完全一致
            'Content-Type': file.type,
          },
          // PUT 上传没有 fields
          fields: {},
        }
      },
    })
  }

  // 监听粘贴事件
  document.addEventListener('paste', handlePaste)

  // 添加文件时
  uppy.on('files-added', () => {
    if (!isLogin.value) {
      theToast.error('请先登录再上传图片 😢')
      return
    }
    isUploading.value = true
    editorStore.ImageUploading = true
  })
  // 上传开始前，检查是否登录
  uppy.on('upload', () => {
    if (!isLogin.value) {
      theToast.error('请先登录再上传图片 😢')
      return
    }
    theToast.info('正在上传图片，请稍等... ⏳', { duration: 500 })
    isUploading.value = true
    editorStore.ImageUploading = true
  })
  // 单个文件上传失败后，显示错误信息
  uppy.on('upload-error', (file, error, response) => {
    if (props.TheImageSource === ImageSource.LOCAL) {
      type ResponseBody = {
        code: number
        msg: string
        // @ts-nocheck
        /* eslint-disable */
        data: any
      }

      let errorMsg = '上传图片时发生错误 😢'
      // @ts-nocheck
      /* eslint-disable */
      const resp = response as any // 忽略 TS 类型限制
      if (resp?.response) {
        let resObj: ResponseBody

        if (typeof resp.response === 'string') {
          resObj = JSON.parse(resp.response) as ResponseBody
        } else {
          resObj = resp.response as ResponseBody
        }

        if (resObj?.msg) {
          errorMsg = resObj.msg
        }
      }
      theToast.error(errorMsg)
    }
    isUploading.value = false
    editorStore.ImageUploading = false
  })
  // 单个文件上传成功后，保存文件 URL 到 files 列表
  uppy.on('upload-success', (file, response) => {
    theToast.success(`好耶,上传成功！🎉`)

    // 分两种情况: Local 或者 S3
    if (memorySource.value === ImageSource.LOCAL) {
      const res = response.body as unknown as App.Api.Response<App.Api.File.ImageDto>
      const fileUrl = String(res.data.url)
      const { width, height } = res.data
      const item: App.Api.Ech0.ImageToAdd = {
        image_url: fileUrl,
        image_source: ImageSource.LOCAL,
        object_key: '',
        width: width,
        height: height,
      }
      files.value.push(item)
    } else if (memorySource.value === ImageSource.S3) {
      const uploadedFile = tempFiles.value.get(file?.name || '') || ''
      if (!uploadedFile) return

      const item: App.Api.Ech0.ImageToAdd = {
        image_url: uploadedFile.url,
        image_source: ImageSource.S3,
        object_key: uploadedFile.objectKey,
      }
      files.value.push(item)
    }
  })
  // 全部文件上传完成后，发射事件到父组件
  uppy.on('complete', () => {
    isUploading.value = false
    editorStore.ImageUploading = false
    const ImageToAddResult = [...files.value]
    editorStore.handleUppyUploaded(ImageToAddResult)
    files.value = []
    tempFiles.value.clear()
  })
}

// 监听 props.TheImageSource 变化
watch(
  () => props.TheImageSource,
  (newSource, oldSource) => {
    if (newSource !== oldSource) {
      console.log('TheImageSource changed:', newSource, oldSource)
      if (!isUploading.value) {
        memorySource.value = newSource
        console.log('当前没有上传任务，可以切换上传方式')
        // 销毁旧的 Uppy 实例
        uppy?.destroy()
        uppy?.clear()
        files.value = [] // 清空已上传文件列表
        // 初始化新的 Uppy 实例
        initUppy()
      } else {
        theToast.error('当前有文件正在上传，请稍后再切换上传方式 😢')
      }
    }
  },
)

onMounted(() => {
  console.log('TheImageSource:', props.TheImageSource)
  initUppy()
})

onBeforeUnmount(() => {
  document.removeEventListener('paste', handlePaste)
})
</script>

<style scoped>
:deep(.uppy-Root) {
  border: transparent;
}

:deep(.uppy-Dashboard-innerWrap) {
  background-color: var(--image-uploader-bg-color);
}

:deep(.uppy-Dashboard-AddFiles) {
  /* 内阴影 */
  box-shadow:
    inset 0px 0px 2px rgba(80, 80, 80, 0.12),
    inset 0px 0px 2px rgba(80, 80, 80, 0.12);
}

:deep(.uppy-Dashboard-AddFiles-title) {
  color: #6f5427;
}

:deep(.uppy-Dashboard-browse) {
  color: #e5a437;
}
:deep(.uppy-StatusBar) {
  color: var(--text-color);
  background-color: var(--image-uploader-bar-bg-color);
}

:deep(.uppy-DashboardContent-bar) {
  color: var(--text-color);
  background-color: var(--image-uploader-bar-bg-color);
}

:deep(.uppy-StatusBar-statusPrimary) {
  color: var(--text-color);
}

:deep(.uppy-DashboardContent-back) {
  color: #cf8e12;
}

:deep(.uppy-DashboardContent-addMore) {
  color: #cf8e12;
}
</style>
