<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          产品
        </view>
        <wd-form-item :value="getPickerDisplay(productOptions, formData.productId)" placeholder="请选择产品" is-link @click="pickerVisible.product = true" />
        <wd-picker v-model:visible="pickerVisible.product" :model-value="formData.productId" :columns="productOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.productId = value[0]" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          仓库
        </view>
        <wd-form-item :value="getPickerDisplay(warehouseOptions, formData.warehouseId)" placeholder="请选择仓库" is-link @click="pickerVisible.warehouse = true" />
        <wd-picker v-model:visible="pickerVisible.warehouse" :model-value="formData.warehouseId" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.warehouseId = value[0]" />
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/erp/product/product'
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { computed, onMounted, reactive, ref } from 'vue'
import { getProductSimpleList } from '@/api/erp/product/product'
import { getWarehouseSimpleList } from '@/api/erp/stock/warehouse'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { getWotPickerFormValue } from '@/utils/wot'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const productOptions = ref<Product[]>([]) // 产品选项
const warehouseOptions = ref<Warehouse[]>([]) // 仓库选项
const pickerVisible = reactive({
  product: false,
  warehouse: false,
}) // 选择器状态
const formData = reactive({
  productId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.productId) {
    conditions.push(`产品:${getPickerDisplay(productOptions.value, formData.productId)}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${getPickerDisplay(warehouseOptions.value, formData.warehouseId)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索产品库存'
})

/** 获取 picker 展示值 */
function getPickerDisplay(options: Record<string, any>[], value?: number) {
  return getWotPickerFormValue(options, value, { valueKey: 'id', labelKey: 'name' })
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    productId: formData.productId,
    warehouseId: formData.warehouseId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.productId = undefined
  formData.warehouseId = undefined
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  const [products, warehouses] = await Promise.all([
    getProductSimpleList(),
    getWarehouseSimpleList(),
  ])
  productOptions.value = products || []
  warehouseOptions.value = warehouses || []
})
</script>
