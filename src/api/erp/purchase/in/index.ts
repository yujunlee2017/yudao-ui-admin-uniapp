import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @Yunai：按后端 VO 收窄类型，补 PurchaseInItem 明细类型；导出接口改 downloadApiFile 或删除未用方法。
/** ERP 采购入库 */
export interface PurchaseIn {
  id?: number // 入库工单编号
  no?: string // 采购入库号
  supplierId?: number // 供应商编号
  accountId?: number // 结算账户编号
  inTime?: string | number | Date // 入库时间
  orderNo?: string // 关联订单
  discountPercent?: number // 优惠率
  discountPrice?: number // 付款优惠
  totalPrice?: number // 优惠后金额
  otherPrice?: number // 其它费用
  paymentPrice?: number // 应付金额
  totalCount?: number // 合计数量
  status?: number // 状态
  remark?: string // 备注
  fileUrl?: string // 附件地址
  items?: any[] // 入库明细
  [key: string]: any
}

/** 获取采购入库分页列表 */
export function getPurchaseInPage(params: PageParam) {
  return http.get<PageResult<PurchaseIn>>('/erp/purchase-in/page', params)
}

/** 获取采购入库详情 */
export function getPurchaseIn(id: number) {
  return http.get<PurchaseIn>(`/erp/purchase-in/get?id=${id}`)
}

/** 创建采购入库 */
export function createPurchaseIn(data: PurchaseIn) {
  return http.post<number>('/erp/purchase-in/create', data)
}

/** 更新采购入库 */
export function updatePurchaseIn(data: PurchaseIn) {
  return http.put<boolean>('/erp/purchase-in/update', data)
}

/** 更新采购入库状态 */
export function updatePurchaseInStatus(id: number, status: number) {
  return http.put<boolean>('/erp/purchase-in/update-status', undefined, { id, status })
}

/** 删除采购入库 */
export function deletePurchaseIn(ids: number[]) {
  return http.delete<boolean>('/erp/purchase-in/delete', undefined, { ids: ids.join(',') })
}

/** 导出采购入库 Excel */
export function exportPurchaseIn(params: Record<string, any>) {
  return http.get<Blob>('/erp/purchase-in/export-excel', params)
}
