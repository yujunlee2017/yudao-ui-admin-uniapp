import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @Yunai：按后端 VO 收窄类型，补 StockCheckItem 明细类型；导出接口改 downloadApiFile 或删除未用方法。
/** ERP 库存盘点 */
export interface StockCheck {
  id?: number // 盘点编号
  no?: string // 盘点单号
  checkTime?: string | number | Date // 盘点时间
  totalCount?: number // 合计数量
  totalPrice?: number // 合计金额，单位：元
  status?: number // 状态
  remark?: string // 备注
  fileUrl?: string // 附件地址
  items?: any[] // 盘点明细
  [key: string]: any
}

/** 获取库存盘点分页列表 */
export function getStockCheckPage(params: PageParam) {
  return http.get<PageResult<StockCheck>>('/erp/stock-check/page', params)
}

/** 获取库存盘点详情 */
export function getStockCheck(id: number) {
  return http.get<StockCheck>(`/erp/stock-check/get?id=${id}`)
}

/** 创建库存盘点 */
export function createStockCheck(data: StockCheck) {
  return http.post<number>('/erp/stock-check/create', data)
}

/** 更新库存盘点 */
export function updateStockCheck(data: StockCheck) {
  return http.put<boolean>('/erp/stock-check/update', data)
}

/** 更新库存盘点状态 */
export function updateStockCheckStatus(id: number, status: number) {
  return http.put<boolean>('/erp/stock-check/update-status', undefined, { id, status })
}

/** 删除库存盘点 */
export function deleteStockCheck(ids: number[]) {
  return http.delete<boolean>('/erp/stock-check/delete', undefined, { ids: ids.join(',') })
}

/** 导出库存盘点 Excel */
export function exportStockCheck(params: Record<string, any>) {
  return http.get<Blob>('/erp/stock-check/export-excel', params)
}
