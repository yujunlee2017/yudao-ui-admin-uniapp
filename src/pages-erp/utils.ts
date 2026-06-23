import type { ErpField, ErpModule, ErpOptionKey } from './config'
import { erpOptionLoaders, getErpModule } from './config'
import { getDictLabel } from '@/hooks/useDict'
import { currRoute } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import { staticUrl } from '@/utils/download'
import { createFormSchema } from '@/utils/wot'
import { getStockByProductAndWarehouse, getStockCount } from '@/api/erp/stock/stock'

export type ErpOptionsMap = Partial<Record<ErpOptionKey, Array<Record<string, any>>>>

/** 获取当前路由参数 */
export function getCurrentRouteQuery() {
  const query = { ...currRoute().query }
  // #ifdef H5
  const hashQuery = window.location.hash.split('?')[1] || ''
  hashQuery.split('&').forEach((item) => {
    if (!item) {
      return
    }
    const [key, value] = item.split('=')
    query[key] = value ? decodeURIComponent(value) : ''
  })
  // #endif
  return query
}

/** 解析附件文件名 */
export function getFileName(url?: string) {
  if (!url) {
    return '附件'
  }
  const path = url.split('?')[0]
  return decodeURIComponent(path.slice(Math.max(0, path.lastIndexOf('/') + 1))) || '附件'
}

/** 补全附件访问地址 */
export function resolveErpFileUrl(url?: string) {
  if (!url) {
    return ''
  }
  if (/^https?:\/\//.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }
  return staticUrl(url)
}

/** 打开附件（图片预览 / 文档下载） */
export function openErpFile(url?: string) {
  const fullUrl = resolveErpFileUrl(url)
  if (!fullUrl) {
    return
  }
  // #ifdef H5
  window.open(fullUrl)
  return
  // #endif
  if (/\.(?:png|jpe?g|gif|webp|bmp)(?:\?|$)/i.test(fullUrl)) {
    uni.previewImage({ urls: [fullUrl] })
    return
  }
  uni.showLoading({ title: '加载中...' })
  uni.downloadFile({
    url: fullUrl,
    success: (res) => {
      uni.openDocument({ filePath: res.tempFilePath, showMenu: true })
    },
    fail: () => {
      uni.showToast({ icon: 'none', title: '打开附件失败' })
    },
    complete: () => {
      uni.hideLoading()
    },
  })
}

/** 补全 ERP 单据详情的关联名称和明细金额 */
export async function enrichErpDocumentDetail(data: Record<string, any>, moduleKey: string) {
  const detail = data || {}
  const optionKeys: ErpOptionKey[] = ['customer', 'supplier', 'account', 'user', 'warehouse', 'product']
  const entries = await Promise.all(optionKeys.map(async (key) => {
    try {
      const options = await erpOptionLoaders[key]()
      return [key, normalizeOptions(options || [])] as const
    } catch {
      return [key, []] as const
    }
  }))
  const optionsMap = Object.fromEntries(entries) as ErpOptionsMap
  const getOptionLabel = (key: ErpOptionKey, id?: any) => {
    if (id === undefined || id === null || id === '') {
      return undefined
    }
    return optionsMap[key]?.find(item => String(item.id) === String(id))?.name
  }
  const getProductOption = (productId?: any) => {
    if (productId === undefined || productId === null || productId === '') {
      return undefined
    }
    return optionsMap.product?.find(item => String(item.id) === String(productId))
  }
  const productOption = getProductOption(detail.productId)
  const result = {
    ...detail,
    customerName: detail.customerName || getOptionLabel('customer', detail.customerId),
    supplierName: detail.supplierName || getOptionLabel('supplier', detail.supplierId),
    accountName: detail.accountName || getOptionLabel('account', detail.accountId),
    creatorName: detail.creatorName || getOptionLabel('user', detail.creator),
    saleUserName: detail.saleUserName || getOptionLabel('user', detail.saleUserId),
    financeUserName: detail.financeUserName || getOptionLabel('user', detail.financeUserId),
    productName: detail.productName || getOptionLabel('product', detail.productId),
    categoryName: detail.categoryName || productOption?.categoryName,
    unitName: detail.unitName || productOption?.unitName,
    warehouseName: detail.warehouseName || getOptionLabel('warehouse', detail.warehouseId),
    items: Array.isArray(detail.items)
      ? detail.items.map(item => ({
          ...item,
          warehouseName: item.warehouseName || getOptionLabel('warehouse', item.warehouseId),
          fromWarehouseName: item.fromWarehouseName || getOptionLabel('warehouse', item.fromWarehouseId),
          toWarehouseName: item.toWarehouseName || getOptionLabel('warehouse', item.toWarehouseId),
        }))
      : [],
  }
  refreshErpItemsAmount(result, getErpModule(moduleKey))
  return result
}

/** 判断字段是否为时间字段 */
export function isDateField(field: ErpField) {
  return field.type === 'date' || field.prop.endsWith('Time') || field.prop.endsWith('Date')
}

/** 判断字段是否为金额字段 */
export function isMoneyField(field: ErpField) {
  return field.type === 'money' || field.prop.endsWith('Price')
}

/** 获取模块标题字段 */
export function getTitleField(module: ErpModule) {
  return module.fields.find(field => ['name', 'no', 'bizNo'].includes(field.prop)) || module.fields[0]
}

/** 获取列表展示字段 */
export function getListFields(module: ErpModule) {
  const titleProp = getTitleField(module)?.prop
  return module.fields
    .filter(field => field.prop !== titleProp && !field.hiddenInList && field.type !== 'items')
    .slice(0, 6)
}

/** 获取搜索字段 */
export function getSearchFields(module: ErpModule) {
  return module.fields.filter(field => field.searchable && field.type !== 'items')
}

/** 获取表单字段 */
export function getFormFields(module: ErpModule) {
  return module.fields.filter(field => !field.hiddenInForm)
}

/** 获取字段字典类型 */
export function getFieldDictType(field: ErpField) {
  if (field.dictType) {
    return field.dictType
  }
  if (field.type === 'status') {
    return DICT_TYPE.COMMON_STATUS
  }
  if (field.type === 'audit-status') {
    return 'erp_audit_status'
  }
  return ''
}

/** 获取选项展示名称 */
export function getOptionName(option: Record<string, any>) {
  return option.name || option.nickname || option.username || option.label || option.no || option.id
}

/** 规范化选择器选项 */
export function normalizeOptions(list: Record<string, any>[] = []) {
  return list.map(item => ({ ...item, id: item.id ?? item.value, name: getOptionName(item) }))
}

/** 读取选择器展示值 */
export function getPickerText(field: ErpField, value: any, optionsMap: ErpOptionsMap, row?: Record<string, any>) {
  if (field.labelField && row?.[field.labelField]) {
    return row[field.labelField]
  }
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  const options = field.optionsKey ? optionsMap[field.optionsKey] || [] : []
  const option = options.find(item => String(item.id) === String(value))
  return option?.name || String(value)
}

/** 格式化 ERP 字段展示值 */
export function formatErpValue(field: ErpField, row: Record<string, any> = {}, optionsMap: ErpOptionsMap = {}) {
  const value = row[field.prop]
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (field.type === 'picker') {
    return getPickerText(field, value, optionsMap, row)
  }
  if (field.type === 'dict' || field.type === 'status' || field.type === 'audit-status') {
    return getDictLabel(getFieldDictType(field), value) || String(value)
  }
  if (field.type === 'boolean') {
    return value ? '是' : '否'
  }
  if (field.type === 'file') {
    return getFileName(String(value))
  }
  if (isDateField(field)) {
    return formatDateTime(value) || formatDate(value) || String(value)
  }
  if (isMoneyField(field)) {
    const price = Number(value)
    return Number.isNaN(price) ? String(value) : price.toFixed(2)
  }
  return String(value)
}

/** 创建 ERP 表单默认值 */
export function createErpFormData(module: ErpModule) {
  const data: Record<string, any> = {}
  module.fields.forEach((field) => {
    if (field.prop === 'id' || field.readonly) {
      return
    }
    if (field.type === 'items') {
      data[field.prop] = []
    } else if (field.type === 'file') {
      data[field.prop] = ''
    } else if (field.type === 'status') {
      data[field.prop] = CommonStatusEnum.ENABLE
    } else if (field.type === 'boolean') {
      data[field.prop] = false
    } else if (isDateField(field)) {
      data[field.prop] = ''
    } else if (field.type === 'number' || field.type === 'money') {
      data[field.prop] = undefined
    } else {
      data[field.prop] = undefined
    }
  })
  return data
}

/** 创建 ERP 表单校验规则 */
export function createErpFormSchema(module: ErpModule) {
  const rules: Record<string, any[]> = {}
  getFormFields(module).forEach((field) => {
    if (field.required && !field.readonly) {
      rules[field.prop] = [{ required: true, message: `${field.label}不能为空` }]
    }
  })
  return createFormSchema(rules)
}

/** 四舍五入金额 */
export function roundPrice(value: number) {
  return Number(value.toFixed(2))
}

/** 四舍五入数量 */
export function roundCount(value: number) {
  return Number(value.toFixed(3))
}

/** 转换为数字 */
export function toNumber(value: any) {
  const result = Number(value || 0)
  return Number.isNaN(result) ? 0 : result
}

/** 格式化金额（保留两位小数） */
export function formatMoney(value?: any) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  const price = Number(value)
  return Number.isNaN(price) ? String(value) : price.toFixed(2)
}

/** 格式化数量（保留三位小数，去尾零） */
export function formatCount(value?: any) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  const count = Number(value)
  return Number.isNaN(count) ? String(value) : String(Number(count.toFixed(3)))
}

/** 格式化数字（原样转字符串，空值返回 -） */
export function formatNumber(value?: any) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

/** 格式化百分比（保留两位小数） */
export function formatPercent(value?: any) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  const percent = Number(value)
  return Number.isNaN(percent) ? String(value) : percent.toFixed(2)
}

/** 计算单据明细金额 */
export function refreshErpItemsAmount(data: Record<string, any>, module?: ErpModule) {
  if (!Array.isArray(data.items)) {
    return
  }
  let totalCount = 0
  let totalPrice = 0
  data.items.forEach((item) => {
    if (module?.key === 'stock-check' && item.stockCount != null && item.actualCount != null) {
      item.count = roundCount(toNumber(item.actualCount) - toNumber(item.stockCount))
    }

    const count = toNumber(item.count)
    const price = toNumber(item.productPrice || item.price)
    const hasCount = item.count !== undefined && item.count !== null && item.count !== ''
    const hasPrice = (item.productPrice !== undefined && item.productPrice !== null && item.productPrice !== '') || (item.price !== undefined && item.price !== null && item.price !== '')
    const hasTaxAmount = 'totalProductPrice' in item || 'taxPercent' in item || 'taxPrice' in item
    if (hasCount && hasPrice) {
      if (hasTaxAmount) {
        item.totalProductPrice = roundPrice(count * price)
        item.taxPrice = roundPrice(item.totalProductPrice * toNumber(item.taxPercent) / 100)
        item.totalPrice = roundPrice(item.totalProductPrice + item.taxPrice)
      } else {
        item.totalPrice = roundPrice(count * price)
      }
    }
    totalCount += count
    totalPrice += toNumber(item.totalPrice)
  })

  if (data.items.length > 0) {
    if (module?.key === 'finance-payment') {
      const paymentPrice = data.items.reduce((sum, item) => sum + toNumber(item.paymentPrice), 0)
      data.totalPrice = roundPrice(paymentPrice)
      data.paymentPrice = roundPrice(paymentPrice - toNumber(data.discountPrice))
      return
    }
    if (module?.key === 'finance-receipt') {
      const receiptPrice = data.items.reduce((sum, item) => sum + toNumber(item.receiptPrice), 0)
      data.totalPrice = roundPrice(receiptPrice)
      data.receiptPrice = roundPrice(receiptPrice - toNumber(data.discountPrice))
      return
    }
    data.totalCount = roundCount(totalCount)
    const discountPrice = 'discountPercent' in data ? roundPrice(totalPrice * toNumber(data.discountPercent) / 100) : toNumber(data.discountPrice)
    if ('discountPrice' in data || 'discountPercent' in data) {
      data.discountPrice = discountPrice
    }
    data.totalPrice = roundPrice(totalPrice - discountPrice + toNumber(data.otherPrice))
  }
}

/**
 * 按产品与仓库加载库存数量，写入 item.stockCount
 * @param item 明细对象
 * @param warehouseField 仓库 ID 字段名，默认 'warehouseId'（调拨编辑器传 'fromWarehouseId'）
 */
export async function setItemStockCount(item: Record<string, any>, warehouseField = 'warehouseId') {
  if (!item.productId) {
    return
  }
  if (item[warehouseField]) {
    const stock = await getStockByProductAndWarehouse(Number(item.productId), Number(item[warehouseField]))
    item.stockCount = stock?.count || 0
    return
  }
  item.stockCount = await getStockCount(Number(item.productId))
}

/**
 * 刷新单条明细金额（count × price → totalPrice）
 * 不处理税额，税额逻辑见 refreshErpItemsAmount
 */
export function refreshSingleItemAmount(item: Record<string, any>) {
  const hasCount = item.count !== undefined && item.count !== null && item.count !== ''
  const hasProductPrice = item.productPrice !== undefined && item.productPrice !== null && item.productPrice !== ''
  const hasPrice = item.price !== undefined && item.price !== null && item.price !== ''
  if (hasCount && (hasProductPrice || hasPrice)) {
    const count = toNumber(item.count)
    const price = toNumber(item.productPrice || item.price)
    item.totalPrice = roundPrice(count * price)
  }
}
