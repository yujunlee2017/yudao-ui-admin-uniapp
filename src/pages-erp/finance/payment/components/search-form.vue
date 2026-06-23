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
          付款单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入付款单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          付款时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="dateVisible.start = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.paymentTime[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="dateVisible.end = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.paymentTime[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker v-model="formData.paymentTime[0]" v-model:visible="dateVisible.start" title="请选择开始日期" type="date" />
        <wd-datetime-picker v-model="formData.paymentTime[1]" v-model:visible="dateVisible.end" title="请选择结束日期" type="date" />
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
          财务人员
        </view>
        <wd-form-item :value="getPickerDisplay(userOptions, formData.financeUserId)" placeholder="请选择财务人员" is-link @click="pickerVisible.financeUser = true" />
        <wd-picker v-model:visible="pickerVisible.financeUser" :model-value="formData.financeUserId" :columns="userOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.financeUserId = value[0]" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          付款账户
        </view>
        <wd-form-item :value="getPickerDisplay(accountOptions, formData.accountId)" placeholder="请选择付款账户" is-link @click="pickerVisible.account = true" />
        <wd-picker v-model:visible="pickerVisible.account" :model-value="formData.accountId" :columns="accountOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.accountId = value[0]" />
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
          采购单号
        </view>
        <wd-input v-model="formData.bizNo" placeholder="请输入采购单号" clearable />
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
import type { Supplier } from '@/api/erp/purchase/supplier'
import type { User } from '@/api/system/user'
import { computed, onMounted, reactive, ref } from 'vue'
import { getAccountSimpleList } from '@/api/erp/finance/account'
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
const accountOptions = ref<Account[]>([])
const supplierOptions = ref<Supplier[]>([])
const userOptions = ref<Array<User & { name: string }>>([])
const pickerVisible = reactive({
  account: false,
  creator: false,
  financeUser: false,
  supplier: false,
})
const dateVisible = reactive({
  start: false,
  end: false,
})
const formData = reactive({
  no: undefined as string | undefined,
  paymentTime: ['', ''] as [any, any],
  supplierId: undefined as number | undefined,
  creator: undefined as number | undefined,
  financeUserId: undefined as number | undefined,
  accountId: undefined as number | undefined,
  status: -1,
  remark: undefined as string | undefined,
  bizNo: undefined as string | undefined,
})

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.paymentTime[0] && formData.paymentTime[1]) {
    conditions.push(`付款时间:${formatDate(formData.paymentTime[0])}~${formatDate(formData.paymentTime[1])}`)
  }
  if (formData.supplierId) {
    conditions.push(`供应商:${getPickerDisplay(supplierOptions.value, formData.supplierId)}`)
  }
  if (formData.accountId) {
    conditions.push(`账户:${getPickerDisplay(accountOptions.value, formData.accountId)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索付款单'
})

function getPickerDisplay(options: Record<string, any>[], value?: number) {
  return getWotPickerFormValue(options, value, { valueKey: 'id', labelKey: 'name' })
}

function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    paymentTime: formatDateRange(formData.paymentTime),
    supplierId: formData.supplierId,
    creator: formData.creator,
    financeUserId: formData.financeUserId,
    accountId: formData.accountId,
    status: formData.status === -1 ? undefined : formData.status,
    remark: formData.remark || undefined,
    bizNo: formData.bizNo || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.paymentTime = ['', '']
  formData.supplierId = undefined
  formData.creator = undefined
  formData.financeUserId = undefined
  formData.accountId = undefined
  formData.status = -1
  formData.remark = undefined
  formData.bizNo = undefined
  visible.value = false
  emit('reset')
}

onMounted(async () => {
  const [accounts, suppliers, users] = await Promise.all([
    getAccountSimpleList(),
    getSupplierSimpleList(),
    getSimpleUserList(),
  ])
  accountOptions.value = accounts || []
  supplierOptions.value = suppliers || []
  userOptions.value = (users || []).map(item => ({ ...item, name: item.nickname || item.username }))
})
</script>
