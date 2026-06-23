<template>
  <view class="w-full">
    <view v-for="(item, index) in items" :key="index" class="mb-24rpx rounded-12rpx bg-[#f8f8f8] p-20rpx">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">调拨明细 {{ index + 1 }}</text>
        <wd-button v-if="!disabled && items.length > 1" size="small" type="error" variant="plain" @click="handleRemove(index)">
          删除
        </wd-button>
      </view>

      <wd-form-item title="调出仓库" title-width="180rpx" is-link :value="getWarehouseDisplay(item.fromWarehouseId)" placeholder="请选择调出仓库" @click="openFromWarehousePicker(index)" />
      <wd-picker v-model:visible="fromWarehousePickerVisible[index]" :model-value="item.fromWarehouseId" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="({ value }) => handleFromWarehouseConfirm(index, value[0])" />

      <wd-form-item title="调入仓库" title-width="180rpx" is-link :value="getWarehouseDisplay(item.toWarehouseId)" placeholder="请选择调入仓库" @click="openToWarehousePicker(index)" />
      <wd-picker v-model:visible="toWarehousePickerVisible[index]" :model-value="item.toWarehouseId" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="({ value }) => handleToWarehouseConfirm(index, value[0])" />

      <wd-form-item title="产品" title-width="180rpx" is-link :value="getProductDisplay(item.productId)" placeholder="请选择产品" @click="openProductPicker(index)" />
      <wd-picker v-model:visible="productPickerVisible[index]" :model-value="item.productId" :columns="productOptions" label-key="name" value-key="id" @confirm="({ value }) => handleProductConfirm(index, value[0])" />

      <wd-cell title="调出库存" :value="formatCount(item.stockCount)" />
      <wd-cell title="条码" :value="item.productBarCode || '-'" />
      <wd-cell title="单位" :value="item.productUnitName || '-'" />

      <wd-form-item title="数量" title-width="180rpx" center>
        <wd-input-number v-model="item.count" :min="0.001" :precision="3" :disabled="disabled" />
      </wd-form-item>
      <wd-form-item title="产品单价" title-width="180rpx" center>
        <wd-input-number v-model="item.productPrice" :min="0.01" :precision="2" :disabled="disabled" />
      </wd-form-item>
      <wd-cell title="合计金额" :value="formatMoney(item.totalPrice)" />
      <wd-form-item title="备注" title-width="180rpx">
        <wd-input v-model="item.remark" placeholder="请输入备注" clearable :disabled="disabled" />
      </wd-form-item>
    </view>

    <wd-button v-if="!disabled" block variant="plain" @click="handleAdd">
      添加调拨产品
    </wd-button>
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/erp/product/product'
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import { getWotPickerFormValue } from '@/utils/wot'
import { formatCount, formatMoney, refreshSingleItemAmount, setItemStockCount } from '@/pages-erp/utils'

const props = defineProps<{
  disabled?: boolean
  modelValue?: Record<string, any>[]
  productOptions: Product[]
  warehouseOptions: Warehouse[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>[]]
}>()

const toast = useToast()
const items = ref<Record<string, any>[]>([]) // 明细数据
const productPickerVisible = ref<Record<number, boolean>>({}) // 产品选择器状态
const fromWarehousePickerVisible = ref<Record<number, boolean>>({}) // 调出仓库选择器状态
const toWarehousePickerVisible = ref<Record<number, boolean>>({}) // 调入仓库选择器状态

/** 获取产品展示值 */
function getProductDisplay(productId?: number) {
  return getWotPickerFormValue(props.productOptions, productId, { valueKey: 'id', labelKey: 'name' })
}

/** 获取仓库展示值 */
function getWarehouseDisplay(warehouseId?: number) {
  return getWotPickerFormValue(props.warehouseOptions, warehouseId, { valueKey: 'id', labelKey: 'name' })
}

/** 打开产品选择器 */
function openProductPicker(index: number) {
  if (!props.disabled) {
    productPickerVisible.value[index] = true
  }
}

/** 打开调出仓库选择器 */
function openFromWarehousePicker(index: number) {
  if (!props.disabled) {
    fromWarehousePickerVisible.value[index] = true
  }
}

/** 打开调入仓库选择器 */
function openToWarehousePicker(index: number) {
  if (!props.disabled) {
    toWarehousePickerVisible.value[index] = true
  }
}

/** 创建默认明细 */
function createDefaultItem() {
  const defaultWarehouse = props.warehouseOptions.find(item => item.defaultStatus)
  return {
    id: undefined,
    fromWarehouseId: defaultWarehouse?.id,
    toWarehouseId: undefined,
    productId: undefined,
    productName: undefined,
    productUnitName: undefined,
    productBarCode: undefined,
    productPrice: undefined,
    stockCount: undefined,
    count: 1,
    totalPrice: undefined,
    remark: undefined,
  }
}

/** 补充默认调出仓库 */
function applyDefaultWarehouse() {
  const defaultWarehouse = props.warehouseOptions.find(item => item.defaultStatus)
  if (!defaultWarehouse?.id) {
    return
  }
  items.value.forEach((item) => {
    if (!item.fromWarehouseId) {
      item.fromWarehouseId = defaultWarehouse.id
    }
  })
}

/** 新增明细 */
function handleAdd() {
  items.value.push(createDefaultItem())
}

/** 删除明细 */
function handleRemove(index: number) {
  items.value.splice(index, 1)
}

/** 选择调出仓库 */
async function handleFromWarehouseConfirm(index: number, warehouseId?: number) {
  const item = items.value[index]
  if (!item) {
    return
  }
  item.fromWarehouseId = warehouseId
  await setItemStockCount(item, 'fromWarehouseId')
}

/** 选择调入仓库 */
function handleToWarehouseConfirm(index: number, warehouseId?: number) {
  const item = items.value[index]
  if (item) {
    item.toWarehouseId = warehouseId
  }
}

/** 选择产品 */
async function handleProductConfirm(index: number, productId?: number) {
  const item = items.value[index]
  if (!item) {
    return
  }
  item.productId = productId
  const product = props.productOptions.find(option => String(option.id) === String(productId))
  if (product) {
    item.productName = product.name
    item.productUnitName = product.unitName
    item.productBarCode = product.barCode
    item.productPrice = product.minPrice
  }
  await setItemStockCount(item, 'fromWarehouseId')
}

/** 校验明细 */
function validate() {
  if (items.value.length === 0) {
    toast.warning('请至少添加一个调拨产品')
    return false
  }
  const invalidIndex = items.value.findIndex(item => !item.fromWarehouseId || !item.toWarehouseId || !item.productId || !item.count)
  if (invalidIndex >= 0) {
    toast.warning(`请完善调拨明细 ${invalidIndex + 1}`)
    return false
  }
  const sameWarehouseIndex = items.value.findIndex(item => String(item.fromWarehouseId) === String(item.toWarehouseId))
  if (sameWarehouseIndex >= 0) {
    toast.warning(`调拨明细 ${sameWarehouseIndex + 1} 的调出仓库和调入仓库不能相同`)
    return false
  }
  return true
}

watch(() => props.modelValue, (value) => {
  items.value = Array.isArray(value) ? value : []
  applyDefaultWarehouse()
}, { immediate: true })

watch(() => props.warehouseOptions, applyDefaultWarehouse, { deep: true })

watch(items, (value) => {
  value.forEach(item => refreshSingleItemAmount(item))
  emit('update:modelValue', value)
}, { deep: true })

/** 初始化 */
onMounted(() => {
  if (items.value.length === 0 && !props.disabled) {
    handleAdd()
  }
})

defineExpose({ validate })
</script>
