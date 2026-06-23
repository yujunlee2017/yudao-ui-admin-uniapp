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
          收款单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入收款单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          收款时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="dateVisible.start = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.receiptTime[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="dateVisible.end = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.receiptTime[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker v-model="formData.receiptTime[0]" v-model:visible="dateVisible.start" title="请选择开始日期" type="date" />
        <wd-datetime-picker v-model="formData.receiptTime[1]" v-model:visible="dateVisible.end" title="请选择结束日期" type="date" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户
        </view>
        <ErpPicker
          v-model="formData.customerId"
          source="customer"
          form-item
          placeholder="请选择客户"
          @confirm="option => selectedNames.customer = option?.name || ''"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          创建人
        </view>
        <ErpPicker
          v-model="formData.creator"
          source="user"
          form-item
          placeholder="请选择创建人"
          @confirm="option => selectedNames.creator = option?.name || ''"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          财务人员
        </view>
        <ErpPicker
          v-model="formData.financeUserId"
          source="user"
          form-item
          placeholder="请选择财务人员"
          @confirm="option => selectedNames.financeUser = option?.name || ''"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          收款账户
        </view>
        <ErpPicker
          v-model="formData.accountId"
          source="account"
          form-item
          placeholder="请选择收款账户"
          @confirm="option => selectedNames.account = option?.name || ''"
        />
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
          销售单号
        </view>
        <wd-input v-model="formData.bizNo" placeholder="请输入销售单号" clearable />
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
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import ErpPicker from '@/pages-erp/components/erp-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const dateVisible = reactive({ start: false, end: false })
const selectedNames = reactive({
  account: '',
  creator: '',
  customer: '',
  financeUser: '',
})
const formData = reactive({
  no: undefined as string | undefined,
  receiptTime: ['', ''] as [any, any],
  customerId: undefined as number | undefined,
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
  if (formData.receiptTime[0] && formData.receiptTime[1]) {
    conditions.push(`收款时间:${formatDate(formData.receiptTime[0])}~${formatDate(formData.receiptTime[1])}`)
  }
  if (formData.customerId) {
    conditions.push(`客户:${selectedNames.customer || formData.customerId}`)
  }
  if (formData.accountId) {
    conditions.push(`账户:${selectedNames.account || formData.accountId}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索收款单'
})

function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    receiptTime: formatDateRange(formData.receiptTime),
    customerId: formData.customerId,
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
  formData.receiptTime = ['', '']
  formData.customerId = undefined
  formData.creator = undefined
  formData.financeUserId = undefined
  formData.accountId = undefined
  selectedNames.customer = ''
  selectedNames.creator = ''
  selectedNames.financeUser = ''
  selectedNames.account = ''
  formData.status = -1
  formData.remark = undefined
  formData.bizNo = undefined
  visible.value = false
  emit('reset')
}
</script>
