import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @Yunai：按后端 VO 收窄类型，去掉 items?: any[] / [key: string]: any；导出接口改 downloadApiFile 或删除未用方法。
/** ERP 供应商 */
export interface Supplier {
  id?: number // 供应商编号
  name?: string // 供应商名称
  contact?: string // 联系人
  mobile?: string // 手机号码
  telephone?: string // 联系电话
  email?: string // 电子邮箱
  fax?: string // 传真
  remark?: string // 备注
  status?: number // 开启状态
  sort?: number // 排序
  taxNo?: string // 纳税人识别号
  taxPercent?: number // 税率
  bankName?: string // 开户行
  bankAccount?: string // 开户账号
  bankAddress?: string // 开户地址
  items?: any[] // 单据明细
  [key: string]: any
}

/** 获取供应商分页列表 */
export function getSupplierPage(params: PageParam) {
  return http.get<PageResult<Supplier>>('/erp/supplier/page', params)
}

/** 获取供应商精简列表 */
export function getSupplierSimpleList() {
  return http.get<Supplier[]>('/erp/supplier/simple-list')
}

/** 获取供应商详情 */
export function getSupplier(id: number) {
  return http.get<Supplier>(`/erp/supplier/get?id=${id}`)
}

/** 创建供应商 */
export function createSupplier(data: Supplier) {
  return http.post<number>('/erp/supplier/create', data)
}

/** 更新供应商 */
export function updateSupplier(data: Supplier) {
  return http.put<boolean>('/erp/supplier/update', data)
}

/** 删除供应商 */
export function deleteSupplier(id: number) {
  return http.delete<boolean>(`/erp/supplier/delete?id=${id}`)
}

/** 导出供应商 Excel */
export function exportSupplier(params: Record<string, any>) {
  return http.get<Blob>('/erp/supplier/export-excel', params)
}
