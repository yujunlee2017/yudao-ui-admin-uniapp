/** 格式化金额：保留两位小数，非数字回退「-」 */
export function formatMoney(value: any): string {
  const amount = Number(value)
  return Number.isNaN(amount) ? '-' : amount.toFixed(2)
}
