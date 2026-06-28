<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="付款单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item title="付款时间" title-width="220rpx" prop="paymentTime" is-link :value="formatDate(formData.paymentTime) || ''" placeholder="请选择付款时间" @click="dateVisible.paymentTime = true" />
          <wd-datetime-picker v-model="formData.paymentTime" v-model:visible="dateVisible.paymentTime" title="请选择付款时间" type="date" />
          <ErpPicker v-model="formData.supplierId" label="供应商" label-width="220rpx" prop="supplierId" source="supplier" placeholder="请选择供应商" />
          <ErpPicker v-model="formData.financeUserId" label="财务人员" label-width="220rpx" source="user" placeholder="请选择财务人员" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <!-- TODO @AI：这里的交互，要不要对齐？pages-infra/demo/demo03-normal/form/index -->
        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          采购入库、退货单
        </view>
        <wd-cell-group border>
          <wd-form-item title="付款明细" title-width="220rpx">
            <PaymentItemEditor ref="itemEditorRef" v-model="formData.items" :supplier-id="formData.supplierId" />
          </wd-form-item>
        </wd-cell-group>

        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          付款信息
        </view>
        <wd-cell-group border>
          <ErpPicker v-model="formData.accountId" label="付款账户" label-width="220rpx" source="account" placeholder="请选择付款账户" />
          <wd-cell title="合计付款" :value="formatMoney(formData.totalPrice)" />
          <wd-form-item title="优惠金额" title-width="220rpx" prop="discountPrice" center>
            <wd-input-number v-model="formData.discountPrice" :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="实际付款" :value="formatMoney(formData.paymentPrice)" />
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
import type { FinancePayment } from '@/api/erp/finance/payment'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { getAccountSimpleList } from '@/api/erp/finance/account'
import { createFinancePayment, getFinancePayment, updateFinancePayment } from '@/api/erp/finance/payment'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ErpPicker from '@/pages-erp/components/erp-picker.vue'
import PaymentItemEditor from '../components/payment-item-editor.vue'
import { formatMoney, roundPrice, toNumber } from '@/pages-erp/utils'

const props = defineProps<{ id?: number | any }>()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-erp/finance/payment/form/index')
// TODO @Yunai：对齐 system 表单页，直接用 props.id 接参，删除 useRouteQuery/currentId 包装。
const currentId = computed(() => getRouteQueryNumber('id'))

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => currentId.value ? '编辑付款单' : '新增付款单')
// TODO @Yunai：状态变量缺尾注释，按 AGENTS.md 补 // 表单提交状态、// 表单数据。
const formLoading = ref(false)
const formData = ref<FinancePayment>({
  id: undefined,
  no: undefined,
  supplierId: undefined,
  accountId: undefined,
  financeUserId: undefined,
  paymentTime: Date.now(),
  remark: undefined,
  fileUrl: '',
  totalPrice: 0,
  discountPrice: 0,
  paymentPrice: 0,
  items: [],
})
const formRef = ref<FormInstance>()
const itemEditorRef = ref<InstanceType<typeof PaymentItemEditor>>()
const accountOptions = ref<Account[]>([])
const dateVisible = reactive({
  paymentTime: false,
})
const formSchema = createFormSchema({
  supplierId: [{ required: true, message: '供应商不能为空' }],
  paymentTime: [{ required: true, message: '付款时间不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/finance/payment/index')
}

// TODO @AI：写下注释；
function refreshAmount() {
  const items = Array.isArray(formData.value.items) ? formData.value.items : []
  const totalPrice = items.reduce((sum, item) => sum + toNumber(item.paymentPrice), 0)
  formData.value.totalPrice = roundPrice(totalPrice)
  formData.value.paymentPrice = roundPrice(totalPrice - toNumber(formData.value.discountPrice))
}

// TODO @AI：在 src/pages-erp/finance/account 封装一个 picker 组件？
async function loadOptions() {
  const accounts = await getAccountSimpleList()
  accountOptions.value = accounts || []
  const defaultAccount = accountOptions.value.find(item => item.defaultStatus)
  if (!formData.value.accountId && defaultAccount?.id) {
    formData.value.accountId = defaultAccount.id
  }
}

/** 加载详情 */
// TODO @Yunai：加载详情对齐 system/tenant，补 toast.loading/finally close，并直接 getFinancePayment(props.id)，不要 getFinancePayment(Number(currentId.value))。
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = {
    ...formData.value,
    ...await getFinancePayment(Number(currentId.value)),
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
    if (currentId.value) {
      await updateFinancePayment(formData.value)
      toast.success('修改成功')
    } else {
      await createFinancePayment(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:finance-payment:reload')
    delay(handleBack)
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
