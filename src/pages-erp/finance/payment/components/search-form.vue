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
      <yd-search-date-range v-model="formData.paymentTime" label="付款时间" />
      <!-- TODO @Yunai：搜索业务下拉对齐 yd-search-picker，删除 ErpPicker + selectedNames 的重复样板。 -->
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商
        </view>
        <ErpPicker
          v-model="formData.supplierId"
          source="supplier"
          form-item
          placeholder="请选择供应商"
          @confirm="option => selectedNames.supplier = option?.name || ''"
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
          付款账户
        </view>
        <ErpPicker
          v-model="formData.accountId"
          source="account"
          form-item
          placeholder="请选择付款账户"
          @confirm="option => selectedNames.account = option?.name || ''"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <!-- TODO @Yunai：字典/状态筛选对齐 yd-search-picker（dict-type + all-option），不要手写 wd-radio-group + -1「全部」。 -->
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
const selectedNames = reactive({
  account: '',
  creator: '',
  financeUser: '',
  supplier: '',
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
    conditions.push(`供应商:${selectedNames.supplier || formData.supplierId}`)
  }
  if (formData.accountId) {
    conditions.push(`账户:${selectedNames.account || formData.accountId}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索付款单'
})

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
  selectedNames.supplier = ''
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
