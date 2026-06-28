import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @Yunai：按后端 VO 收窄类型，补 FinanceReceiptItem 明细类型；导出接口改 downloadApiFile 或删除未用方法。
/** ERP 收款单 */
export interface FinanceReceipt {
  id?: number // 收款单编号
  no?: string // 收款单号
  customerId?: number // 客户编号
  accountId?: number // 结算账户编号
  financeUserId?: number // 财务人员编号
  receiptTime?: string | number | Date // 收款时间
  totalPrice?: number // 合计金额，单位：元
  discountPrice?: number // 优惠金额，单位：元
  receiptPrice?: number // 实际收款，单位：元
  status?: number // 状态
  remark?: string // 备注
  fileUrl?: string // 附件地址
  items?: any[] // 收款明细
  [key: string]: any
}

/** 获取收款单分页列表 */
export function getFinanceReceiptPage(params: PageParam) {
  return http.get<PageResult<FinanceReceipt>>('/erp/finance-receipt/page', params)
}

/** 获取收款单详情 */
export function getFinanceReceipt(id: number) {
  return http.get<FinanceReceipt>(`/erp/finance-receipt/get?id=${id}`)
}

/** 创建收款单 */
export function createFinanceReceipt(data: FinanceReceipt) {
  return http.post<number>('/erp/finance-receipt/create', data)
}

/** 更新收款单 */
export function updateFinanceReceipt(data: FinanceReceipt) {
  return http.put<boolean>('/erp/finance-receipt/update', data)
}

/** 更新收款单状态 */
export function updateFinanceReceiptStatus(id: number, status: number) {
  return http.put<boolean>('/erp/finance-receipt/update-status', undefined, { id, status })
}

/** 删除收款单 */
export function deleteFinanceReceipt(ids: number[]) {
  return http.delete<boolean>('/erp/finance-receipt/delete', undefined, { ids: ids.join(',') })
}

/** 导出收款单 Excel */
export function exportFinanceReceipt(params: Record<string, any>) {
  return http.get<Blob>('/erp/finance-receipt/export-excel', params)
}
