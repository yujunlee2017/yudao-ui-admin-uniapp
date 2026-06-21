/** 格式化金额：空值（null/undefined/''）显示「-」，否则保留两位小数，非数字也回退「-」 */
export function formatMoney(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  const amount = Number(value)
  return Number.isNaN(amount) ? '-' : amount.toFixed(2)
}
