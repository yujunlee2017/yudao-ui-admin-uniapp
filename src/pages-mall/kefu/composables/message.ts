import { fenToYuan } from '@/utils/format'

/** 客服消息内容类型：1 文本、2 图片、3 语音、4 视频、5 系统、10 商品、11 订单 */
// TODO @AI：这个弄到 mall 的 constants 里把。
export const KefuContentType = { TEXT: 1, IMAGE: 2, VOICE: 3, VIDEO: 4, SYSTEM: 5, PRODUCT: 10, ORDER: 11 }
/** 发送者类型：1 会员、2 管理员（客服） */
// TODO @AI：这个 usertype 全局是不是有枚举；
export const KefuSenderType = { MEMBER: 1, ADMIN: 2 }

/** 渲染用消息结构（统一形状，避免联合类型在模板取值报错） */
export interface KefuParsedMessage {
  id?: number
  conversationId?: number
  createTime?: string | number
  fromAdmin: boolean // 是否客服（管理员）发送，决定气泡左右
  kind: 'system' | 'image' | 'text' | 'product' | 'order'
  text: string
  picUrl?: string
  title?: string
  price?: number
  orderNo?: string
  payPrice?: number
  productCount?: number
}

/** 解析消息 content（文本/图片/商品/订单均为 JSON 结构） */
export function parseKefuContent(content: any): Record<string, any> {
  if (typeof content !== 'string') {
    return content || {}
  }
  const text = content.trim()
  if (!text.startsWith('{')) {
    return { text }
  }
  try {
    return JSON.parse(text)
  } catch {
    return { text }
  }
}

/** 解析单条消息为渲染结构 */
export function parseKefuMessage(item: Record<string, any>): KefuParsedMessage {
  const payload = parseKefuContent(item.content)
  const isSystem = item.contentType === KefuContentType.SYSTEM
  const isImage = item.contentType === KefuContentType.IMAGE || (!isSystem && !!payload.picUrl)
  const base = {
    id: item.id,
    conversationId: item.conversationId,
    createTime: item.createTime,
    fromAdmin: item.senderType === KefuSenderType.ADMIN,
    text: '',
    picUrl: payload.picUrl,
  }
  // 商品消息（10）：spuName/picUrl/price(分)
  if (item.contentType === KefuContentType.PRODUCT) {
    return { ...base, kind: 'product', title: payload.spuName, price: fenToYuan(payload.price) }
  }
  // 订单消息（11）：no/payPrice(分)/productCount
  if (item.contentType === KefuContentType.ORDER) {
    return { ...base, kind: 'order', orderNo: payload.no, payPrice: fenToYuan(payload.payPrice), productCount: payload.productCount }
  }
  return {
    ...base,
    kind: isSystem ? 'system' : (isImage ? 'image' : 'text'),
    text: payload.text || (typeof item.content === 'string' ? item.content : ''),
  }
}

/** 会话列表「最后一条消息」预览文案 */
export function kefuLastMessagePreview(content: any, contentType?: number): string {
  switch (contentType) {
    case KefuContentType.IMAGE: return '[图片]'
    case KefuContentType.VOICE: return '[语音]'
    case KefuContentType.VIDEO: return '[视频]'
    case KefuContentType.PRODUCT: return '[商品]'
    case KefuContentType.ORDER: return '[订单]'
    default: {
      const payload = parseKefuContent(content)
      return payload.text || (typeof content === 'string' ? content : '') || '暂无消息'
    }
  }
}

// TODO @AI：弄到全局去？
/** 容错转 Date：兼容毫秒时间戳（数字或纯数字字符串）与日期字符串 */
function toDate(time?: string | number): Date | undefined {
  if (time == null || time === '') {
    return undefined
  }
  const ms = typeof time === 'number'
    ? time
    : (/^\d+$/.test(String(time)) ? Number(time) : Date.parse(String(time)))
  const date = new Date(ms)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const pad = (value: number) => String(value).padStart(2, '0')

// TODO @AI：弄到全局去？（换个更通用的名字）看看 vue3 + ep 是怎么弄的。（我的理解，这个肯定是通用的）
/** 会话列表时间：今天显示 HH:mm，否则 MM-DD */
export function formatKefuTime(time?: string | number): string {
  const date = toDate(time)
  if (!date) {
    return ''
  }
  const now = new Date()
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  return sameDay ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// TODO @AI：弄到全局去？（换个更通用的名字）看看 vue3 + ep 是怎么弄的。（我的理解，这个肯定是通用的）
/** 完整日期时间：YYYY-MM-DD HH:mm（聊天时间分隔、会员资料等复用，容错毫秒时间戳） */
export function formatKefuDateTime(time?: string | number): string {
  const date = toDate(time)
  if (!date) {
    return ''
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
