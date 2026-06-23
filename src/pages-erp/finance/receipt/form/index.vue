<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="收款单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item title="收款时间" title-width="220rpx" prop="receiptTime" is-link :value="formatDate(formData.receiptTime) || ''" placeholder="请选择收款时间" @click="dateVisible.receiptTime = true" />
          <wd-datetime-picker v-model="formData.receiptTime" v-model:visible="dateVisible.receiptTime" title="请选择收款时间" type="date" />
          <wd-form-item title="客户" title-width="220rpx" prop="customerId" is-link :value="customerDisplayValue" placeholder="请选择客户" @click="pickerVisible.customer = true" />
          <wd-picker v-model:visible="pickerVisible.customer" :model-value="formData.customerId" :columns="customerOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.customerId = value[0]" />
          <wd-form-item title="财务人员" title-width="220rpx" is-link :value="financeUserDisplayValue" placeholder="请选择财务人员" @click="pickerVisible.financeUser = true" />
          <wd-picker v-model:visible="pickerVisible.financeUser" :model-value="formData.financeUserId" :columns="userOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.financeUserId = value[0]" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          销售出库、退货单
        </view>
        <wd-cell-group border>
          <wd-form-item title="收款明细" title-width="220rpx">
            <ReceiptItemEditor ref="itemEditorRef" v-model="formData.items" :customer-id="formData.customerId" />
          </wd-form-item>
        </wd-cell-group>

        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          收款信息
        </view>
        <wd-cell-group border>
          <wd-form-item title="收款账户" title-width="220rpx" is-link :value="accountDisplayValue" placeholder="请选择收款账户" @click="pickerVisible.account = true" />
          <wd-picker v-model:visible="pickerVisible.account" :model-value="formData.accountId" :columns="accountOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.accountId = value[0]" />
          <wd-cell title="合计收款" :value="formatMoney(formData.totalPrice)" />
          <wd-form-item title="优惠金额" title-width="220rpx" prop="discountPrice" center>
            <wd-input-number v-model="formData.discountPrice" :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="实际收款" :value="formatMoney(formData.receiptPrice)" />
        </wd-cell-group>
      </wd-form>

      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Account } from '@/api/erp/finance/account'
import type { FinanceReceipt } from '@/api/erp/finance/receipt'
import type { Customer } from '@/api/erp/sale/customer'
import type { User } from '@/api/system/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getAccountSimpleList } from '@/api/erp/finance/account'
import { createFinanceReceipt, getFinanceReceipt, updateFinanceReceipt } from '@/api/erp/finance/receipt'
import { getCustomerSimpleList } from '@/api/erp/sale/customer'
import { getSimpleUserList } from '@/api/system/user'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import ReceiptItemEditor from '../components/receipt-item-editor.vue'
import { formatMoney, roundPrice, toNumber } from '@/pages-erp/utils'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑收款单' : '新增收款单')
const formLoading = ref(false)
const formData = ref<FinanceReceipt>({
  id: undefined,
  no: undefined,
  customerId: undefined,
  accountId: undefined,
  financeUserId: undefined,
  receiptTime: Date.now(),
  remark: undefined,
  fileUrl: '',
  totalPrice: 0,
  discountPrice: 0,
  receiptPrice: 0,
  items: [],
})
const formRef = ref<FormInstance>()
const itemEditorRef = ref<InstanceType<typeof ReceiptItemEditor>>()
const accountOptions = ref<Account[]>([])
const customerOptions = ref<Customer[]>([])
const userOptions = ref<Array<User & { name: string }>>([])
const pickerVisible = reactive({
  account: false,
  customer: false,
  financeUser: false,
})
const dateVisible = reactive({
  receiptTime: false,
})
const formSchema = createFormSchema({
  customerId: [{ required: true, message: '客户不能为空' }],
  receiptTime: [{ required: true, message: '收款时间不能为空' }],
})
const customerDisplayValue = computed(() => getWotPickerFormValue(customerOptions.value, formData.value.customerId, { valueKey: 'id', labelKey: 'name' }))
const accountDisplayValue = computed(() => getWotPickerFormValue(accountOptions.value, formData.value.accountId, { valueKey: 'id', labelKey: 'name' }))
const financeUserDisplayValue = computed(() => getWotPickerFormValue(userOptions.value, formData.value.financeUserId, { valueKey: 'id', labelKey: 'name' }))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/finance/receipt/index')
}

function refreshAmount() {
  const items = Array.isArray(formData.value.items) ? formData.value.items : []
  const totalPrice = items.reduce((sum, item) => sum + toNumber(item.receiptPrice), 0)
  formData.value.totalPrice = roundPrice(totalPrice)
  formData.value.receiptPrice = roundPrice(totalPrice - toNumber(formData.value.discountPrice))
}

async function loadOptions() {
  const [accounts, customers, users] = await Promise.all([
    getAccountSimpleList(),
    getCustomerSimpleList(),
    getSimpleUserList(),
  ])
  accountOptions.value = accounts || []
  customerOptions.value = customers || []
  userOptions.value = (users || []).map(item => ({ ...item, name: item.nickname || item.username }))
  const defaultAccount = accountOptions.value.find(item => item.defaultStatus)
  if (!formData.value.accountId && defaultAccount?.id) {
    formData.value.accountId = defaultAccount.id
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = {
    ...formData.value,
    ...await getFinanceReceipt(Number(props.id)),
  }
  refreshAmount()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !itemEditorRef.value?.validate()) {
    return
  }
  refreshAmount()
  formLoading.value = true
  try {
    if (props.id) {
      await updateFinanceReceipt(formData.value)
      toast.success('修改成功')
    } else {
      await createFinanceReceipt(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:finance-receipt:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

watch(() => [formData.value.items, formData.value.discountPrice], refreshAmount, { deep: true })

onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
