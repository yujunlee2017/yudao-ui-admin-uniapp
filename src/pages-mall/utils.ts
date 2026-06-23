// TODO @AI：是不是应该弄到 /Users/yunai/Java/yudao-ui-admin-uniapp-next-v4/src/utils；对齐 vue3 的做法；
/** 分转元（数值） */
export function fenToYuan(value: any) {
  if (value === undefined || value === null || value === '') {
    return 0
  }
  const amount = Number(value)
  return Number.isNaN(amount) ? 0 : amount / 100
}

/** 元转分（整数） */
export function yuanToFen(value: any) {
  if (value === undefined || value === null || value === '') {
    return 0
  }
  const amount = Number(value)
  return Number.isNaN(amount) ? 0 : Math.round(amount * 100)
}

// TODO @AI：是不是一个通用的方法哈？
/** 格式化金额展示（分 → ￥x.xx） */
export function formatMallMoney(value: any) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  const amount = Number(value)
  if (Number.isNaN(amount)) {
    return String(value)
  }
  return `￥${(amount / 100).toFixed(2)}`
}

// TODO @AI：是不是没在用？？？
/** 解析 JSON 输入：字符串则尝试 JSON.parse，失败返回原文 */
export function parseMallJson(value: any) {
  if (typeof value !== 'string') {
    return value
  }
  const text = value.trim()
  if (!text) {
    return undefined
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// TODO @AI：是不是一个通用方法？
/** 解析数组输入：逗号/换行分隔的字符串转数组 */
export function parseMallArray(value: any, valueType: 'number' | 'string' = 'string') {
  if (Array.isArray(value)) {
    return value
  }
  return String(value)
    .split(/[,，\n]/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => valueType === 'number' ? Number(item) : item)
    .filter(item => valueType !== 'number' || !Number.isNaN(item as number))
}
