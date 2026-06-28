import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// TODO @Yunai：按后端 VO 收窄类型，补 FinancePaymentItem 明细类型；导出接口改 downloadApiFile 或删除未用方法。
/** ERP 付款单 */
export interface FinancePayment {
  id?: number // 付款单编号
  no?: string // 付款单号
  supplierId?: number // 供应商编号
  accountId?: number // 结算账户编号
  financeUserId?: number // 财务人员编号
  paymentTime?: string | number | Date // 付款时间
  totalPrice?: number // 合计金额，单位：元
  discountPrice?: number // 优惠金额，单位：元
  paymentPrice?: number // 实际付款，单位：元
  status?: number // 状态
  remark?: string // 备注
  fileUrl?: string // 附件地址
  items?: any[] // 付款明细
  [key: string]: any
}

/** 获取付款单分页列表 */
export function getFinancePaymentPage(params: PageParam) {
  return http.get<PageResult<FinancePayment>>('/erp/finance-payment/page', params)
}

/** 获取付款单详情 */
export function getFinancePayment(id: number) {
  return http.get<FinancePayment>(`/erp/finance-payment/get?id=${id}`)
}

/** 创建付款单 */
export function createFinancePayment(data: FinancePayment) {
  return http.post<number>('/erp/finance-payment/create', data)
}

/** 更新付款单 */
export function updateFinancePayment(data: FinancePayment) {
  return http.put<boolean>('/erp/finance-payment/update', data)
}

/** 更新付款单状态 */
export function updateFinancePaymentStatus(id: number, status: number) {
  return http.put<boolean>('/erp/finance-payment/update-status', undefined, { id, status })
}

/** 删除付款单 */
export function deleteFinancePayment(ids: number[]) {
  return http.delete<boolean>('/erp/finance-payment/delete', undefined, { ids: ids.join(',') })
}

/** 导出付款单 Excel */
export function exportFinancePayment(params: Record<string, any>) {
  return http.get<Blob>('/erp/finance-payment/export-excel', params)
}
