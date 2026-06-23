/** 金额分转元展示 */
export function formatPayAmount(value?: number | string) {
  const amount = Number(value || 0) / 100
  return `￥${amount.toFixed(2)}`
}

/** 金额展示：空值显示 '-'，否则分转元 */
export function formatPayMoney(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return formatPayAmount(value)
}

/** 金额元转分 */
export function yuanToFen(value?: number | string) {
  return Math.round(Number(value || 0) * 100)
}

/** 金额分转元数字 */
export function fenToYuan(value?: number | string) {
  return Number((Number(value || 0) / 100).toFixed(2))
}
