import request from '@/utils/request'

/**
 * 上传图片
 * @param {File} file - 图片文件
 * @param {string} folder - 子目录（可选，如：avatar、product）
 * @returns {Promise} 返回图片访问URL
 */
export function uploadImage(file, folder = 'product') {
  const formData = new FormData()
  formData.append('file', file)
  if (folder) {
    formData.append('folder', folder)
  }
  return request({
    url: '/common/file/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 删除图片
 * @param {string} path - 图片路径
 * @returns {Promise}
 */
export function deleteImage(path) {
  return request({
    url: '/common/file/delete',
    method: 'delete',
    params: { path }
  })
}
