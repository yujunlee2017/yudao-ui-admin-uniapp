<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

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
          订单单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入订单单号" clearable />
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
          订单时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="dateVisible.start = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.orderTime[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="dateVisible.end = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.orderTime[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker v-model="formData.orderTime[0]" v-model:visible="dateVisible.start" title="请选择开始日期" type="date" />
        <wd-datetime-picker v-model="formData.orderTime[1]" v-model:visible="dateVisible.end" title="请选择结束日期" type="date" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商
        </view>
        <wd-form-item :value="getPickerDisplay(supplierOptions, formData.supplierId)" placeholder="请选择供应商" is-link @click="pickerVisible.supplier = true" />
        <wd-picker v-model:visible="pickerVisible.supplier" :model-value="formData.supplierId" :columns="supplierOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.supplierId = value[0]" />
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
          状态
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
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          入库数量
        </view>
        <wd-radio-group v-model="formData.inStatus" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="0">
            未入库
          </wd-radio>
          <wd-radio :value="1">
            部分入库
          </wd-radio>
          <wd-radio :value="2">
            全部入库
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退货数量
        </view>
        <wd-radio-group v-model="formData.returnStatus" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="0">
            未退货
          </wd-radio>
          <wd-radio :value="1">
            部分退货
          </wd-radio>
          <wd-radio :value="2">
            全部退货
          </wd-radio>
        </wd-radio-group>
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
import type { Supplier } from '@/api/erp/purchase/supplier'
import type { User } from '@/api/system/user'
import { computed, onMounted, reactive, ref } from 'vue'
import { getProductSimpleList } from '@/api/erp/product/product'
import { getSupplierSimpleList } from '@/api/erp/purchase/supplier'
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

const visible = ref(false)
const productOptions = ref<Product[]>([])
const supplierOptions = ref<Supplier[]>([])
const userOptions = ref<Array<User & { name: string }>>([])
const pickerVisible = reactive({
  creator: false,
  product: false,
  supplier: false,
})
const dateVisible = reactive({
  start: false,
  end: false,
})
const formData = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  orderTime: ['', ''] as [any, any],
  supplierId: undefined as number | undefined,
  creator: undefined as number | undefined,
  status: -1,
  remark: undefined as string | undefined,
  inStatus: -1,
  returnStatus: -1,
})

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${getPickerDisplay(productOptions.value, formData.productId)}`)
  }
  if (formData.orderTime[0] && formData.orderTime[1]) {
    conditions.push(`订单时间:${formatDate(formData.orderTime[0])}~${formatDate(formData.orderTime[1])}`)
  }
  if (formData.supplierId) {
    conditions.push(`供应商:${getPickerDisplay(supplierOptions.value, formData.supplierId)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索采购订单'
})

function getPickerDisplay(options: Record<string, any>[], value?: number) {
  return getWotPickerFormValue(options, value, { valueKey: 'id', labelKey: 'name' })
}

function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    productId: formData.productId,
    orderTime: formatDateRange(formData.orderTime),
    supplierId: formData.supplierId,
    creator: formData.creator,
    status: formData.status === -1 ? undefined : formData.status,
    remark: formData.remark || undefined,
    inStatus: formData.inStatus === -1 ? undefined : formData.inStatus,
    returnStatus: formData.returnStatus === -1 ? undefined : formData.returnStatus,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.productId = undefined
  formData.orderTime = ['', '']
  formData.supplierId = undefined
  formData.creator = undefined
  formData.status = -1
  formData.remark = undefined
  formData.inStatus = -1
  formData.returnStatus = -1
  visible.value = false
  emit('reset')
}

onMounted(async () => {
  const [products, suppliers, users] = await Promise.all([
    getProductSimpleList(),
    getSupplierSimpleList(),
    getSimpleUserList(),
  ])
  productOptions.value = products || []
  supplierOptions.value = suppliers || []
  userOptions.value = (users || []).map(item => ({ ...item, name: item.nickname || item.username }))
})
</script>
