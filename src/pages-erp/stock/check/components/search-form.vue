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
          盘点单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入盘点单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          产品
        </view>
        <wd-form-item :value="getPickerDisplay(productOptions, formData.productId)" placeholder="请选择产品" is-link @click="pickerVisible.product = true" />
        <wd-picker v-model:visible="pickerVisible.product" :model-value="formData.productId" :columns="productOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.productId = value[0]" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          盘点时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="dateVisible.start = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.checkTime[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="dateVisible.end = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.checkTime[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker v-model="formData.checkTime[0]" v-model:visible="dateVisible.start" title="请选择开始日期" type="date" />
        <wd-datetime-picker v-model="formData.checkTime[1]" v-model:visible="dateVisible.end" title="请选择结束日期" type="date" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          仓库
        </view>
        <wd-form-item :value="getPickerDisplay(warehouseOptions, formData.warehouseId)" placeholder="请选择仓库" is-link @click="pickerVisible.warehouse = true" />
        <wd-picker v-model:visible="pickerVisible.warehouse" :model-value="formData.warehouseId" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.warehouseId = value[0]" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          创建人
        </view>
        <wd-form-item :value="getPickerDisplay(userOptions, formData.creator)" placeholder="请选择创建人" is-link @click="pickerVisible.creator = true" />
        <wd-picker v-model:visible="pickerVisible.creator" :model-value="formData.creator" :columns="userOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.creator = value[0]" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          审核状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.ERP_AUDIT_STATUS)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          备注
        </view>
        <wd-input v-model="formData.remark" placeholder="请输入备注" clearable />
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
import type { User } from '@/api/system/user'
import { computed, onMounted, reactive, ref } from 'vue'
import { getProductSimpleList } from '@/api/erp/product/product'
import { getWarehouseSimpleList } from '@/api/erp/stock/warehouse'
import { getSimpleUserList } from '@/api/system/user'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { getWotPickerFormValue } from '@/utils/wot'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const productOptions = ref<Product[]>([]) // 产品选项
const warehouseOptions = ref<Warehouse[]>([]) // 仓库选项
const userOptions = ref<Array<User & { name: string }>>([]) // 用户选项
const pickerVisible = reactive({
  creator: false,
  product: false,
  warehouse: false,
}) // 选择器状态
const dateVisible = reactive({
  start: false,
  end: false,
}) // 日期选择器状态
const formData = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  checkTime: ['', ''] as [any, any],
  warehouseId: undefined as number | undefined,
  creator: undefined as number | undefined,
  status: -1,
  remark: undefined as string | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${getPickerDisplay(productOptions.value, formData.productId)}`)
  }
  if (formData.checkTime[0] && formData.checkTime[1]) {
    conditions.push(`盘点时间:${formatDate(formData.checkTime[0])}~${formatDate(formData.checkTime[1])}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${getPickerDisplay(warehouseOptions.value, formData.warehouseId)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索库存盘点'
})

/** 获取 picker 展示值 */
function getPickerDisplay(options: Record<string, any>[], value?: number) {
  return getWotPickerFormValue(options, value, { valueKey: 'id', labelKey: 'name' })
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    productId: formData.productId,
    checkTime: formatDateRange(formData.checkTime),
    warehouseId: formData.warehouseId,
    creator: formData.creator,
    status: formData.status === -1 ? undefined : formData.status,
    remark: formData.remark || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.productId = undefined
  formData.checkTime = ['', '']
  formData.warehouseId = undefined
  formData.creator = undefined
  formData.status = -1
  formData.remark = undefined
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  const [products, warehouses, users] = await Promise.all([
    getProductSimpleList(),
    getWarehouseSimpleList(),
    getSimpleUserList(),
  ])
  productOptions.value = products || []
  warehouseOptions.value = warehouses || []
  userOptions.value = (users || []).map(item => ({ ...item, name: item.nickname || item.username }))
})
</script>
