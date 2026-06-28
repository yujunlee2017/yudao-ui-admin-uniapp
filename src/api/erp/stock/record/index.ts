import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @Yunai：按后端 VO 收窄类型，去掉 items?: any[] / [key: string]: any；导出接口改 downloadApiFile 或删除未用方法。
/** ERP 库存明细 */
export interface StockRecord {
  id?: number // 编号
  productId?: number // 产品编号
  warehouseId?: number // 仓库编号
  count?: number // 出入库数量
  totalCount?: number // 总库存量
  bizType?: number // 业务类型
  bizId?: number // 业务编号
  bizItemId?: number // 业务项编号
  bizNo?: string // 业务单号
  items?: any[] // 单据明细
  [key: string]: any
}

/** 获取库存明细分页列表 */
export function getStockRecordPage(params: PageParam) {
  return http.get<PageResult<StockRecord>>('/erp/stock-record/page', params)
}

/** 获取库存明细详情 */
export function getStockRecord(id: number) {
  return http.get<StockRecord>(`/erp/stock-record/get?id=${id}`)
}

/** 导出库存明细 Excel */
export function exportStockRecord(params: Record<string, any>) {
  return http.get<Blob>('/erp/stock-record/export-excel', params)
}
