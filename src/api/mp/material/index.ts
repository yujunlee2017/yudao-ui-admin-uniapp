import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { getEnvBaseUrl } from '@/utils'

const baseUrl = '/mp/material'

/** 公众号素材 */
export interface Material {
  id: number
  accountId?: number
  type?: string
  name?: string
  mediaId?: string
  url?: string
  title?: string
  introduction?: string
  createTime?: Date
}

/** 公众号素材分页查询参数 */
export interface MaterialPageParam extends PageParam {
  accountId: number
  type?: string
  permanent?: boolean
}

/** 获取公众号素材分页 */
export function getMaterialPage(params: MaterialPageParam) {
  return http.get<PageResult<Material>>(`${baseUrl}/page`, params)
}

/** 删除公众号永久素材 */
export function deletePermanentMaterial(id: number) {
  return http.delete<boolean>(`${baseUrl}/delete-permanent?id=${id}`)
}

/** 上传公众号永久素材 */
export function uploadPermanentMaterial(
  filePath: string,
  data: { accountId: number, type: string, title?: string, introduction?: string },
) {
  const tokenStore = useTokenStore()
  const userStore = useUserStore()
  const token = tokenStore.updateNowTime().validToken
  return new Promise<Material>((resolve, reject) => {
    uni.uploadFile({
      url: getUploadUrl(),
      filePath,
      name: 'file',
      header: {
        'Accept': '*/*',
        'Authorization': `Bearer ${token}`,
        'tenant-id': userStore.tenantId,
      },
      formData: data,
      success: (res) => {
        const result = JSON.parse(res.data)
        if (res.statusCode >= 200 && res.statusCode < 300 && (result.code === 0 || result.code === 200)) {
          resolve(result.data)
        } else {
          reject(result)
        }
      },
      fail: reject,
    })
  })
}

/** 获取素材上传地址 */
function getUploadUrl() {
  // #ifdef H5
  if (JSON.parse(import.meta.env.VITE_APP_PROXY_ENABLE)) {
    return `${import.meta.env.VITE_APP_PROXY_PREFIX}${baseUrl}/upload-permanent`
  }
  // #endif
  return `${getEnvBaseUrl()}${baseUrl}/upload-permanent`
}
