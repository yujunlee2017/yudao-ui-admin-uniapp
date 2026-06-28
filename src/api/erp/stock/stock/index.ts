import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @Yunai：按后端 VO 收窄类型，去掉 items?: any[] / [key: string]: any；导出接口改 downloadApiFile 或删除未用方法。
/** ERP 产品库存 */
export interface Stock {
  id?: number // 编号
  productId?: number // 产品编号
  warehouseId?: number // 仓库编号
  count?: number // 库存数量
  items?: any[] // 单据明细
  [key: string]: any
}

/** 获取产品库存分页列表 */
export function getStockPage(params: PageParam) {
  return http.get<PageResult<Stock>>('/erp/stock/page', params)
}

/** 获取产品库存详情 */
export function getStock(id: number) {
  return http.get<Stock>(`/erp/stock/get?id=${id}`)
}

/** 根据产品和仓库获取库存详情 */
export function getStockByProductAndWarehouse(productId: number, warehouseId: number) {
  return http.get<Stock>('/erp/stock/get', { productId, warehouseId })
}

/** 获取产品库存数量 */
export function getStockCount(productId: number) {
  return http.get<number>('/erp/stock/get-count', { productId })
}

/** 导出产品库存 Excel */
export function exportStock(params: Record<string, any>) {
  return http.get<Blob>('/erp/stock/export-excel', params)
}
