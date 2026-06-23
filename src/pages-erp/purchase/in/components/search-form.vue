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
          入库单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入入库单号" clearable />
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
          入库时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="dateVisible.start = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.inTime[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="dateVisible.end = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.inTime[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker v-model="formData.inTime[0]" v-model:visible="dateVisible.start" title="请选择开始日期" type="date" />
        <wd-datetime-picker v-model="formData.inTime[1]" v-model:visible="dateVisible.end" title="请选择结束日期" type="date" />
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
          仓库
        </view>
        <wd-form-item :value="getPickerDisplay(warehouseOptions, formData.warehouseId)" placeholder="请选择仓库" is-link @click="pickerVisible.warehouse = true" />
        <wd-picker v-model:visible="pickerVisible.warehouse" :model-value="formData.warehouseId" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.warehouseId = value[0]" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          关联订单
        </view>
        <wd-input v-model="formData.orderNo" placeholder="请输入关联订单" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          结算账户
        </view>
        <wd-form-item :value="getPickerDisplay(accountOptions, formData.accountId)" placeholder="请选择结算账户" is-link @click="pickerVisible.account = true" />
        <wd-picker v-model:visible="pickerVisible.account" :model-value="formData.accountId" :columns="accountOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.accountId = value[0]" />
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
          付款状态
        </view>
        <wd-radio-group v-model="formData.paymentStatus" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="0">
            未付款
          </wd-radio>
          <wd-radio :value="1">
            部分付款
          </wd-radio>
          <wd-radio :value="2">
            全部付款
          </wd-radio>
        </wd-radio-group>
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
import type { Account } from '@/api/erp/finance/account'
import type { Product } from '@/api/erp/product/product'
import type { Supplier } from '@/api/erp/purchase/supplier'
import type { Warehouse } from '@/api/erp/stock/warehouse'
import type { User } from '@/api/system/user'
import { computed, onMounted, reactive, ref } from 'vue'
import { getAccountSimpleList } from '@/api/erp/finance/account'
import { getProductSimpleList } from '@/api/erp/product/product'
import { getSupplierSimpleList } from '@/api/erp/purchase/supplier'
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

const visible = ref(false)
const accountOptions = ref<Account[]>([])
const productOptions = ref<Product[]>([])
const supplierOptions = ref<Supplier[]>([])
const warehouseOptions = ref<Warehouse[]>([])
const userOptions = ref<Array<User & { name: string }>>([])
const pickerVisible = reactive({
  account: false,
  creator: false,
  product: false,
  supplier: false,
  warehouse: false,
})
const dateVisible = reactive({
  start: false,
  end: false,
})
const formData = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  inTime: ['', ''] as [any, any],
  supplierId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  orderNo: undefined as string | undefined,
  accountId: undefined as number | undefined,
  creator: undefined as number | undefined,
  paymentStatus: -1,
  status: -1,
  remark: undefined as string | undefined,
})

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.productId) {
    conditions.push(`产品:${getPickerDisplay(productOptions.value, formData.productId)}`)
  }
  if (formData.inTime[0] && formData.inTime[1]) {
    conditions.push(`入库时间:${formatDate(formData.inTime[0])}~${formatDate(formData.inTime[1])}`)
  }
  if (formData.supplierId) {
    conditions.push(`供应商:${getPickerDisplay(supplierOptions.value, formData.supplierId)}`)
  }
  if (formData.warehouseId) {
    conditions.push(`仓库:${getPickerDisplay(warehouseOptions.value, formData.warehouseId)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索采购入库'
})

function getPickerDisplay(options: Record<string, any>[], value?: number) {
  return getWotPickerFormValue(options, value, { valueKey: 'id', labelKey: 'name' })
}

function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    productId: formData.productId,
    inTime: formatDateRange(formData.inTime),
    supplierId: formData.supplierId,
    warehouseId: formData.warehouseId,
    orderNo: formData.orderNo || undefined,
    accountId: formData.accountId,
    creator: formData.creator,
    paymentStatus: formData.paymentStatus === -1 ? undefined : formData.paymentStatus,
    status: formData.status === -1 ? undefined : formData.status,
    remark: formData.remark || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.productId = undefined
  formData.inTime = ['', '']
  formData.supplierId = undefined
  formData.warehouseId = undefined
  formData.orderNo = undefined
  formData.accountId = undefined
  formData.creator = undefined
  formData.paymentStatus = -1
  formData.status = -1
  formData.remark = undefined
  visible.value = false
  emit('reset')
}

onMounted(async () => {
  const [accounts, products, suppliers, warehouses, users] = await Promise.all([
    getAccountSimpleList(),
    getProductSimpleList(),
    getSupplierSimpleList(),
    getWarehouseSimpleList(),
    getSimpleUserList(),
  ])
  accountOptions.value = accounts || []
  productOptions.value = products || []
  supplierOptions.value = suppliers || []
  warehouseOptions.value = warehouses || []
  userOptions.value = (users || []).map(item => ({ ...item, name: item.nickname || item.username }))
})
</script>
