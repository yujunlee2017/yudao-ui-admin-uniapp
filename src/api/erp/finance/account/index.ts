import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @Yunai：按后端 VO 收窄类型，去掉 items?: any[] / [key: string]: any；导出接口改 downloadApiFile 或删除未用方法。
/** ERP 结算账户 */
export interface Account {
  id?: number // 结算账户编号
  no?: string // 账户编码
  remark?: string // 备注
  status?: number // 开启状态
  sort?: number // 排序
  defaultStatus?: boolean // 是否默认
  name?: string // 账户名称
  items?: any[] // 单据明细
  [key: string]: any
}

/** 获取结算账户分页列表 */
export function getAccountPage(params: PageParam) {
  return http.get<PageResult<Account>>('/erp/account/page', params)
}

/** 获取结算账户精简列表 */
export function getAccountSimpleList() {
  return http.get<Account[]>('/erp/account/simple-list')
}

/** 获取结算账户详情 */
export function getAccount(id: number) {
  return http.get<Account>(`/erp/account/get?id=${id}`)
}

/** 创建结算账户 */
export function createAccount(data: Account) {
  return http.post<number>('/erp/account/create', data)
}

/** 更新结算账户 */
export function updateAccount(data: Account) {
  return http.put<boolean>('/erp/account/update', data)
}

/** 修改结算账户默认状态 */
export function updateAccountDefaultStatus(id: number, defaultStatus: boolean) {
  return http.put<boolean>('/erp/account/update-default-status', undefined, { id, defaultStatus })
}

/** 删除结算账户 */
export function deleteAccount(id: number) {
  return http.delete<boolean>(`/erp/account/delete?id=${id}`)
}

/** 导出结算账户 Excel */
export function exportAccount(params: Record<string, any>) {
  return http.get<Blob>('/erp/account/export-excel', params)
}
