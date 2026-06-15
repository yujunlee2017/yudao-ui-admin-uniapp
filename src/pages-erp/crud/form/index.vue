<template>
  <view v-if="moduleConfig" class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <!-- 关联单据选择 -->
      <BizSelector
        :module-key="moduleKey"
        :form-data="formData"
        @select="handleBizSelect"
      />

      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <template v-for="field in formFields" :key="field.prop">
            <template v-if="shouldShowField(field)">
              <wd-cell
                v-if="isReadonlyField(field)"
                :title="field.label"
                :value="formatErpValue(field, formData, optionsMap)"
              />
              <template v-else-if="field.type === 'picker'">
                <wd-form-item
                  :title="field.label"
                  title-width="200rpx"
                  :prop="field.prop"
                  is-link
                  :value="getPickerValue(field)"
                  placeholder="请选择"
                  @click="pickerVisible[field.prop] = true"
                />
                <wd-picker
                  v-model:visible="pickerVisible[field.prop]"
                  :model-value="formData[field.prop]"
                  :columns="getPickerOptions(field)"
                  label-key="name"
                  value-key="id"
                  @confirm="({ value }) => formData[field.prop] = value[0]"
                />
              </template>
              <template v-else-if="field.type === 'date' || isDateField(field)">
                <wd-form-item
                  :title="field.label"
                  title-width="200rpx"
                  :prop="field.prop"
                  is-link
                  :value="formatDateTime(formData[field.prop])"
                  placeholder="请选择"
                  @click="dateVisible[field.prop] = true"
                />
                <wd-datetime-picker
                  v-model="formData[field.prop]"
                  v-model:visible="dateVisible[field.prop]"
                  :title="`请选择${field.label}`"
                  type="datetime"
                />
              </template>
              <wd-form-item v-else-if="field.type === 'status'" :title="field.label" title-width="200rpx" :prop="field.prop" center>
                <wd-radio-group v-model="formData[field.prop]" type="button">
                  <wd-radio
                    v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                    :key="dict.value"
                    :value="dict.value"
                  >
                    {{ dict.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <wd-form-item v-else-if="field.type === 'boolean'" :title="field.label" title-width="200rpx" :prop="field.prop" center>
                <wd-switch v-model="formData[field.prop]" />
              </wd-form-item>
              <wd-form-item v-else-if="field.type === 'textarea'" :title="field.label" title-width="200rpx" :prop="field.prop">
                <wd-textarea
                  v-model="formData[field.prop]"
                  :placeholder="`请输入${field.label}`"
                  :maxlength="500"
                  show-word-limit
                  clearable
                />
              </wd-form-item>
              <wd-form-item v-else-if="field.type === 'file'" :title="field.label" title-width="200rpx" :prop="field.prop">
                <yd-upload-file v-model="formData[field.prop]" :limit="1" directory="erp" />
              </wd-form-item>
              <wd-form-item v-else-if="field.type === 'items'" :title="field.label" title-width="200rpx">
                <view class="w-full">
                  <view v-for="(item, index) in formData.items" :key="index" class="mb-20rpx rounded-12rpx bg-[#f8f8f8] p-20rpx">
                    <view class="mb-12rpx flex items-center justify-between">
                      <text class="text-28rpx text-[#333] font-semibold">明细 {{ index + 1 }}</text>
                      <wd-button size="small" type="error" variant="plain" @click="handleRemoveItem(index)">
                        删除
                      </wd-button>
                    </view>
                    <template v-for="itemField in itemFields" :key="itemField.prop">
                      <template v-if="shouldShowItemField(itemField, item)">
                        <wd-cell
                          v-if="isReadonlyItemField(itemField)"
                          :title="itemField.label"
                          :value="formatErpValue(itemField, item, optionsMap)"
                        />
                        <template v-else-if="itemField.type === 'picker'">
                          <wd-form-item
                            :title="itemField.label"
                            title-width="180rpx"
                            is-link
                            :value="getItemPickerValue(itemField, item)"
                            placeholder="请选择"
                            @click="itemPickerVisible[getItemPickerKey(index, itemField)] = true"
                          />
                          <wd-picker
                            v-model:visible="itemPickerVisible[getItemPickerKey(index, itemField)]"
                            :model-value="item[itemField.prop]"
                            :columns="getPickerOptions(itemField)"
                            label-key="name"
                            value-key="id"
                            @confirm="({ value }) => handleItemPickerConfirm(item, itemField, value)"
                          />
                        </template>
                        <wd-form-item v-else-if="itemField.type === 'textarea'" :title="itemField.label" title-width="180rpx">
                          <wd-textarea v-model="item[itemField.prop]" :placeholder="`请输入${itemField.label}`" clearable />
                        </wd-form-item>
                        <wd-form-item v-else :title="itemField.label" title-width="180rpx">
                          <wd-input
                            v-model="item[itemField.prop]"
                            :type="itemField.type === 'number' || itemField.type === 'money' ? 'number' : 'text'"
                            :placeholder="`请输入${itemField.label}`"
                            clearable
                            @blur="refreshFormAmount"
                          />
                        </wd-form-item>
                      </template>
                    </template>
                  </view>
                  <wd-button block variant="plain" @click="handleAddItem">
                    添加明细
                  </wd-button>
                </view>
              </wd-form-item>
              <wd-form-item v-else :title="field.label" title-width="200rpx" :prop="field.prop">
                <wd-input
                  v-model="formData[field.prop]"
                  :type="field.type === 'number' || field.type === 'money' ? 'number' : 'text'"
                  :placeholder="`请输入${field.label}`"
                  clearable
                />
              </wd-form-item>
            </template>
          </template>
        </wd-cell-group>
      </wd-form>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>

  <view v-else class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="ERP 表单"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />
    <!-- 空状态 -->
    <wd-empty icon="content" tip="ERP 模块不存在" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ErpField, ErpOptionKey } from '@/pages-erp/config'
import type { ErpOptionsMap } from '@/pages-erp/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import * as StockApi from '@/api/erp/stock/stock'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { getWotPickerFormValue } from '@/utils/wot'
import { erpOptionLoaders, getErpItemFields, getErpModule } from '@/pages-erp/config'
import { createErpFormData, createErpFormSchema, formatErpValue, getCurrentRouteQuery, getFormFields, isDateField, normalizeOptions, refreshErpItemsAmount } from '@/pages-erp/utils'
import BizSelector from '../components/biz-selector.vue'

const props = defineProps<{
  module?: string
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const routeQuery = ref<Record<string, any>>({}) // 路由参数
const moduleKey = computed(() => String(routeQuery.value.module || props.module || ''))
const formId = computed(() => routeQuery.value.id || props.id)
const moduleConfig = computed(() => getErpModule(moduleKey.value))
const getTitle = computed(() => formId.value ? `编辑${moduleConfig.value?.title || 'ERP'}` : `新增${moduleConfig.value?.title || 'ERP'}`)
const formLoading = ref(false) // 表单提交状态
const formData = ref<Record<string, any>>({}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器状态
const itemPickerVisible = ref<Record<string, boolean>>({}) // 明细选择器状态
const dateVisible = ref<Record<string, boolean>>({}) // 日期选择器状态
const optionsMap = ref<ErpOptionsMap>({}) // 选择器选项
const formFields = computed(() => moduleConfig.value ? getFormFields(moduleConfig.value) : [])
const itemFields = computed(() => getErpItemFields(moduleConfig.value))
const formSchema = computed(() => moduleConfig.value ? createErpFormSchema(moduleConfig.value) : undefined)
const ERP_BIZ_TYPE = {
  PURCHASE_IN: 11,
  PURCHASE_RETURN: 12,
  SALE_OUT: 21,
  SALE_RETURN: 22,
} as const

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-erp/crud/index?module=${moduleKey.value}`)
}

/** 判断只读字段 */
function isReadonlyField(field: ErpField) {
  return field.readonly || field.type === 'audit-status' || field.type === 'dict'
}

/** 判断空值 */
function isEmptyValue(value: any) {
  return value === undefined || value === null || value === ''
}

/** 判断是否展示字段 */
function shouldShowField(field: ErpField) {
  if (field.hiddenInForm) {
    return false
  }
  if (isReadonlyField(field) && !formId.value) {
    return false
  }
  if (field.prop === 'saleUserId' || field.prop === 'financeUserId') {
    return !!formData.value[field.prop] || formId.value
  }
  return true
}

/** 判断明细只读字段 */
function isReadonlyItemField(field: ErpField) {
  return field.readonly || field.type === 'dict'
}

/** 判断是否展示明细字段 */
function shouldShowItemField(field: ErpField, item: Record<string, any>) {
  if (field.hiddenInForm) {
    return false
  }
  if (field.hiddenWhenEmpty && isEmptyValue(item[field.prop])) {
    return false
  }
  return true
}

/** 获取选择器选项 */
function getPickerOptions(field: ErpField) {
  return field.optionsKey ? optionsMap.value[field.optionsKey] || [] : []
}

/** 获取选择器展示值 */
function getPickerValue(field: ErpField) {
  return getWotPickerFormValue(getPickerOptions(field), formData.value[field.prop], { valueKey: 'id', labelKey: 'name' })
}

/** 获取明细选择器展示值 */
function getItemPickerValue(field: ErpField, item: Record<string, any>) {
  return getWotPickerFormValue(getPickerOptions(field), item[field.prop], { valueKey: 'id', labelKey: 'name' })
}

/** 获取明细选择器状态键 */
function getItemPickerKey(index: number, field: ErpField) {
  return `${index}:${field.prop}`
}

/** 同步产品信息 */
function syncProductInfo(item: Record<string, any>, productId: any) {
  const product = (optionsMap.value.product || []).find(option => String(option.id) === String(productId))
  if (!product) {
    return
  }
  item.productName = product.name
  item.productUnitName = product.unitName
  item.productBarCode = product.barCode
  if (isEmptyValue(item.productPrice)) {
    if (moduleKey.value.startsWith('purchase')) {
      item.productPrice = product.purchasePrice
    } else if (moduleKey.value.startsWith('sale')) {
      item.productPrice = product.salePrice
    } else {
      item.productPrice = product.minPrice
    }
  }
}

/** 加载明细库存 */
async function loadItemStockCount(item: Record<string, any>) {
  if (!item.productId || !('stockCount' in item)) {
    return
  }
  const warehouseId = item.fromWarehouseId || item.warehouseId
  if (warehouseId) {
    const stock = await StockApi.getStockByProductAndWarehouse(Number(item.productId), Number(warehouseId))
    item.stockCount = stock?.count || 0
  } else {
    item.stockCount = await StockApi.getStockCount(Number(item.productId)) || 0
  }
  if (moduleKey.value === 'stock-check' && isEmptyValue(item.actualCount)) {
    item.actualCount = item.stockCount
  }
  refreshFormAmount()
}

/** 选择明细字段 */
async function handleItemPickerConfirm(item: Record<string, any>, field: ErpField, value: any[]) {
  item[field.prop] = value[0]
  const option = getPickerOptions(field).find(data => String(data.id) === String(item[field.prop]))
  if (field.labelField && option) {
    item[field.labelField] = option.name
  }
  if (field.prop === 'productId') {
    syncProductInfo(item, item[field.prop])
  }
  refreshFormAmount()
  if (['productId', 'warehouseId', 'fromWarehouseId'].includes(field.prop)) {
    await loadItemStockCount(item)
  }
}

/** 刷新表单金额 */
function refreshFormAmount() {
  refreshErpItemsAmount(formData.value, moduleConfig.value)
}

/** 转换为数字 */
function toNumber(value: any) {
  const result = Number(value || 0)
  return Number.isNaN(result) ? 0 : result
}

/** 复制来源单据明细 */
function createSourceItem(item: Record<string, any>, count: number) {
  return {
    ...item,
    totalCount: item.totalCount ?? item.count,
    count,
    orderItemId: item.id,
    id: undefined,
  }
}

/** 设置来源订单基础信息 */
function applyOrderBase(row: Record<string, any>) {
  formData.value.orderId = row.id
  formData.value.orderNo = row.no
  formData.value.accountId = row.accountId
  formData.value.discountPercent = row.discountPercent
  formData.value.remark = row.remark
  formData.value.fileUrl = row.fileUrl
}

/** 设置采购订单来源 */
function applyPurchaseOrder(row: Record<string, any>, type: 'in' | 'return') {
  applyOrderBase(row)
  formData.value.supplierId = row.supplierId
  const items = Array.isArray(row.items) ? row.items : []
  formData.value.items = items
    .map((item) => {
      const count = type === 'in'
        ? toNumber(item.count) - toNumber(item.inCount)
        : toNumber(item.inCount) - toNumber(item.returnCount)
      return createSourceItem(item, count)
    })
    .filter(item => toNumber(item.count) > 0)
  refreshFormAmount()
}

/** 设置销售订单来源 */
function applySaleOrder(row: Record<string, any>, type: 'out' | 'return') {
  applyOrderBase(row)
  formData.value.customerId = row.customerId
  formData.value.saleUserId = row.saleUserId
  const items = Array.isArray(row.items) ? row.items : []
  formData.value.items = items
    .map((item) => {
      const count = type === 'out'
        ? toNumber(item.count) - toNumber(item.outCount)
        : toNumber(item.outCount) - toNumber(item.returnCount)
      return createSourceItem(item, count)
    })
    .filter(item => toNumber(item.count) > 0)
  refreshFormAmount()
}

/** 添加付款明细 */
function addPaymentRows(rows: Record<string, any>[], type: typeof ERP_BIZ_TYPE.PURCHASE_IN | typeof ERP_BIZ_TYPE.PURCHASE_RETURN) {
  if (!Array.isArray(formData.value.items)) {
    formData.value.items = []
  }
  rows.forEach((row) => {
    if (type === ERP_BIZ_TYPE.PURCHASE_IN) {
      const paidPrice = toNumber(row.paymentPrice)
      formData.value.items.push({
        bizId: row.id,
        bizType: ERP_BIZ_TYPE.PURCHASE_IN,
        bizNo: row.no,
        totalPrice: toNumber(row.totalPrice),
        paidPrice,
        paymentPrice: toNumber(row.totalPrice) - paidPrice,
      })
      return
    }
    const refundPrice = toNumber(row.refundPrice)
    formData.value.items.push({
      bizId: row.id,
      bizType: ERP_BIZ_TYPE.PURCHASE_RETURN,
      bizNo: row.no,
      totalPrice: -toNumber(row.totalPrice),
      paidPrice: -refundPrice,
      paymentPrice: -toNumber(row.totalPrice) + refundPrice,
    })
  })
  refreshFormAmount()
}

/** 添加收款明细 */
function addReceiptRows(rows: Record<string, any>[], type: typeof ERP_BIZ_TYPE.SALE_OUT | typeof ERP_BIZ_TYPE.SALE_RETURN) {
  if (!Array.isArray(formData.value.items)) {
    formData.value.items = []
  }
  rows.forEach((row) => {
    if (type === ERP_BIZ_TYPE.SALE_OUT) {
      const receiptedPrice = toNumber(row.receiptPrice)
      formData.value.items.push({
        bizId: row.id,
        bizType: ERP_BIZ_TYPE.SALE_OUT,
        bizNo: row.no,
        totalPrice: toNumber(row.totalPrice),
        receiptedPrice,
        receiptPrice: toNumber(row.totalPrice) - receiptedPrice,
      })
      return
    }
    const refundPrice = toNumber(row.refundPrice)
    formData.value.items.push({
      bizId: row.id,
      bizType: ERP_BIZ_TYPE.SALE_RETURN,
      bizNo: row.no,
      totalPrice: -toNumber(row.totalPrice),
      receiptedPrice: -refundPrice,
      receiptPrice: -toNumber(row.totalPrice) + refundPrice,
    })
  })
  refreshFormAmount()
}

/** 选择关联单据 */
function handleBizSelect(payload: { key: string, rows: Record<string, any>[] }) {
  const row = payload.rows[0]
  if (payload.key === 'purchase-order-in' && row) {
    applyPurchaseOrder(row, 'in')
  } else if (payload.key === 'purchase-order-return' && row) {
    applyPurchaseOrder(row, 'return')
  } else if (payload.key === 'sale-order-out' && row) {
    applySaleOrder(row, 'out')
  } else if (payload.key === 'sale-order-return' && row) {
    applySaleOrder(row, 'return')
  } else if (payload.key === 'purchase-in-payment') {
    addPaymentRows(payload.rows, ERP_BIZ_TYPE.PURCHASE_IN)
  } else if (payload.key === 'purchase-return-refund') {
    addPaymentRows(payload.rows, ERP_BIZ_TYPE.PURCHASE_RETURN)
  } else if (payload.key === 'sale-out-receipt') {
    addReceiptRows(payload.rows, ERP_BIZ_TYPE.SALE_OUT)
  } else if (payload.key === 'sale-return-refund') {
    addReceiptRows(payload.rows, ERP_BIZ_TYPE.SALE_RETURN)
  }
}

/** 添加明细 */
function handleAddItem() {
  if (!Array.isArray(formData.value.items)) {
    formData.value.items = []
  }
  const item: Record<string, any> = {}
  const defaultWarehouse = (optionsMap.value.warehouse || []).find(option => option.defaultStatus)
  itemFields.value.forEach((field) => {
    if (field.prop === 'count' && moduleKey.value !== 'stock-check') {
      item[field.prop] = 1
    } else if (['warehouseId', 'fromWarehouseId'].includes(field.prop) && defaultWarehouse) {
      item[field.prop] = defaultWarehouse.id
      if (field.labelField) {
        item[field.labelField] = defaultWarehouse.name
      }
    } else {
      item[field.prop] = undefined
    }
  })
  formData.value.items.push(item)
  refreshFormAmount()
}

/** 删除明细 */
function handleRemoveItem(index: number) {
  formData.value.items?.splice(index, 1)
}

/** 加载选择器选项 */
async function loadOptions() {
  if (!moduleConfig.value) {
    return
  }
  const keys = new Set<ErpOptionKey>()
  moduleConfig.value.fields.concat(itemFields.value).forEach((field: ErpField) => {
    if (field.optionsKey) {
      keys.add(field.optionsKey)
    }
  })
  const entries = await Promise.all(Array.from(keys).map(async (key) => {
    try {
      const data = await erpOptionLoaders[key]()
      return [key, normalizeOptions(data || [])] as const
    } catch {
      return [key, []] as const
    }
  }))
  optionsMap.value = Object.fromEntries(entries) as ErpOptionsMap
}

/** 加载详情 */
async function getDetail() {
  if (!moduleConfig.value) {
    return
  }
  formData.value = createErpFormData(moduleConfig.value)
  if (!formId.value) {
    if (formFields.value.some(field => field.type === 'items')) {
      formData.value.items = []
    }
    return
  }
  const data = await moduleConfig.value.operations.get(Number(formId.value))
  formData.value = {
    ...createErpFormData(moduleConfig.value),
    ...data,
    items: Array.isArray(data?.items) ? data.items : [],
  }
}

/** 提交表单 */
async function handleSubmit() {
  if (!moduleConfig.value) {
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  const data = { ...formData.value }
  refreshErpItemsAmount(data, moduleConfig.value)
  formLoading.value = true
  try {
    if (formId.value) {
      await moduleConfig.value.operations.update?.(data)
      toast.success('修改成功')
    } else {
      await moduleConfig.value.operations.create?.(data)
      toast.success('新增成功')
    }
    uni.$emit(`erp:reload:${moduleKey.value}`)
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 同步路由参数 */
function syncRouteQuery() {
  routeQuery.value = getCurrentRouteQuery()
}

/** 监听表单参数变化 */
watch(() => [moduleKey.value, formId.value], () => {
  pickerVisible.value = {}
  itemPickerVisible.value = {}
  dateVisible.value = {}
  loadOptions()
  getDetail()
}, { immediate: true })

/** 初始化 */
onMounted(() => {
  syncRouteQuery()
  // #ifdef H5
  window.addEventListener('hashchange', syncRouteQuery)
  // #endif
})

/** 卸载路由监听 */
onUnmounted(() => {
  // #ifdef H5
  window.removeEventListener('hashchange', syncRouteQuery)
  // #endif
})
</script>
