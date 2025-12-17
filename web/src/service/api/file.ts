import { request } from '../request'

// 上传图片
export function fetchUploadImage(file: File, source?: string) {
  const formData = new FormData()
  formData.append('file', file)

  if (source) {
    formData.append('ImageSource', source)
  }

  return request<App.Api.File.ImageDto>({
    url: `/images/upload`,
    method: 'POST',
    data: formData,
  })
}

// 删除Image
export function fetchDeleteImage(image: App.Api.Ech0.ImageToDelete) {
  return request({
    url: `/images/delete`,
    method: 'DELETE',
    data: image,
  })
}
