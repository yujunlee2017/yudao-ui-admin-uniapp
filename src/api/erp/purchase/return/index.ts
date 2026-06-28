import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @Yunai：按后端 VO 收窄类型，补 PurchaseReturnItem 明细类型；导出接口改 downloadApiFile 或删除未用方法。
/** ERP 采购退货 */
export interface PurchaseReturn {
  id?: number // 采购退货编号
  no?: string // 采购退货号
  supplierId?: number // 供应商编号
  accountId?: number // 结算账户编号
  returnTime?: string | number | Date // 退货时间
  orderNo?: string // 关联订单
  discountPercent?: number // 优惠率
  discountPrice?: number // 退款优惠
  totalPrice?: number // 优惠后金额
  otherPrice?: number // 其它费用
  refundPrice?: number // 应退金额
  totalCount?: number // 合计数量
  status?: number // 状态
  remark?: string // 备注
  fileUrl?: string // 附件地址
  items?: any[] // 退货明细
  [key: string]: any
}

/** 获取采购退货分页列表 */
export function getPurchaseReturnPage(params: PageParam) {
  return http.get<PageResult<PurchaseReturn>>('/erp/purchase-return/page', params)
}

/** 获取采购退货详情 */
export function getPurchaseReturn(id: number) {
  return http.get<PurchaseReturn>(`/erp/purchase-return/get?id=${id}`)
}

/** 创建采购退货 */
export function createPurchaseReturn(data: PurchaseReturn) {
  return http.post<number>('/erp/purchase-return/create', data)
}

/** 更新采购退货 */
export function updatePurchaseReturn(data: PurchaseReturn) {
  return http.put<boolean>('/erp/purchase-return/update', data)
}

/** 更新采购退货状态 */
export function updatePurchaseReturnStatus(id: number, status: number) {
  return http.put<boolean>('/erp/purchase-return/update-status', undefined, { id, status })
}

/** 删除采购退货 */
export function deletePurchaseReturn(ids: number[]) {
  return http.delete<boolean>('/erp/purchase-return/delete', undefined, { ids: ids.join(',') })
}

/** 导出采购退货 Excel */
export function exportPurchaseReturn(params: Record<string, any>) {
  return http.get<Blob>('/erp/purchase-return/export-excel', params)
}
