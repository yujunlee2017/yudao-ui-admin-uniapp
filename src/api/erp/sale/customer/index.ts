import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @Yunai：按后端 VO 收窄类型，去掉 items?: any[] / [key: string]: any；导出接口改 downloadApiFile 或删除未用方法。
/** ERP 客户 */
export interface Customer {
  id?: number // 客户编号
  name?: string // 客户名称
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

/** 获取客户分页列表 */
export function getCustomerPage(params: PageParam) {
  return http.get<PageResult<Customer>>('/erp/customer/page', params)
}

/** 获取客户精简列表 */
export function getCustomerSimpleList() {
  return http.get<Customer[]>('/erp/customer/simple-list')
}

/** 获取客户详情 */
export function getCustomer(id: number) {
  return http.get<Customer>(`/erp/customer/get?id=${id}`)
}

/** 创建客户 */
export function createCustomer(data: Customer) {
  return http.post<number>('/erp/customer/create', data)
}

/** 更新客户 */
export function updateCustomer(data: Customer) {
  return http.put<boolean>('/erp/customer/update', data)
}

/** 删除客户 */
export function deleteCustomer(id: number) {
  return http.delete<boolean>(`/erp/customer/delete?id=${id}`)
}

/** 导出客户 Excel */
export function exportCustomer(params: Record<string, any>) {
  return http.get<Blob>('/erp/customer/export-excel', params)
}
