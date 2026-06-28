<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="付款单详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="付款单号" :value="formData?.no || '-'" />
        <wd-cell title="供应商" :value="formData?.supplierName || '-'" />
        <wd-cell title="付款时间" :value="formatDateTime(formData?.paymentTime) || '-'" />
        <wd-cell title="创建人" :value="formData?.creatorName || '-'" />
        <wd-cell title="财务人员" :value="formData?.financeUserName || '-'" />
        <wd-cell title="付款账户" :value="formData?.accountName || '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.ERP_AUDIT_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="合计付款" :value="formatMoney(formData?.totalPrice)" />
        <wd-cell title="优惠金额" :value="formatMoney(formData?.discountPrice)" />
        <wd-cell title="实际付款" :value="formatMoney(formData?.paymentPrice)" />
        <wd-cell title="附件" :value="formData?.fileUrl ? '查看附件' : '-'" :is-link="!!formData?.fileUrl" @click="handleOpenFile" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 付款明细 -->
      <ErpDetailItems title="付款明细" :items="items" :fields="itemFields" />

      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <!-- TODO @AI：不做类似的封装哈，参考别的模块处理底部操作； -->
    <ErpAuditActions
      :can-update="canUpdate"
      :can-update-status="canUpdateStatus"
      :can-delete="canDelete"
      :deleting="deleting"
      :status-loading="statusLoading"
      :next-status="nextStatus"
      @edit="handleEdit"
      @update-status="handleUpdateStatus"
      @delete="handleDelete"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FinancePayment } from '@/api/erp/finance/payment'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { deleteFinancePayment, getFinancePayment, updateFinancePaymentStatus } from '@/api/erp/finance/payment'
import { useAccess } from '@/hooks/useAccess'
import ErpDetailItems from '@/pages-erp/components/erp-detail-items.vue'
import ErpAuditActions from '@/pages-erp/components/erp-audit-actions.vue'
import type { ErpDetailItemField } from '@/pages-erp/components/types'
import { enrichErpDocumentDetail, formatMoney, openErpFile } from '@/pages-erp/utils'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-erp/finance/payment/detail/index')
// TODO @Yunai：对齐 system 页面，直接用 props.id 接参，删除 useRouteQuery/currentId 包装。
const currentId = computed(() => getRouteQueryNumber('id'))

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const ERP_BIZ_TYPE = { // TODO @Yunai：删除局部定义，统一用 utils/constants/biz-erp-enum.ts 的 ErpBizType（含 PURCHASE_IN:11 等 6 值）。payment-item-editor.vue 同款，共 4 处重复定义。
  PURCHASE_IN: 11,
  PURCHASE_RETURN: 12,
} as const

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
// TODO @Yunai：状态变量缺尾注释，按 AGENTS.md 补 // 详情数据、// 删除状态、// 审批提交状态。
const formData = ref<FinancePayment>()
const deleting = ref(false)
const statusLoading = ref(false)
const items = computed(() => Array.isArray(formData.value?.items) ? formData.value.items : [])
// TODO @Yunai：明细字段按 AGENTS 改成逐字段模板，不再通过 itemFields 配置生成。
const itemFields: ErpDetailItemField[] = [
  { prop: 'bizNo', label: '采购单据编号' },
  { prop: 'bizType', label: '采购业务类型', formatter: value => getBizTypeName(value) },
  { prop: 'totalPrice', label: '应付金额', type: 'money' },
  { prop: 'paidPrice', label: '已付金额', type: 'money' },
  { prop: 'paymentPrice', label: '本次付款', type: 'money' },
  { prop: 'remark', label: '备注', hiddenWhenEmpty: true },
] // 付款明细字段
// TODO @Yunai：审批状态魔法数字 10/20 改 ErpAuditStatusEnum（同 purchase/order/detail，4 处）
const canUpdate = computed(() => formData.value?.status !== 20 && hasAccessByCodes(['erp:finance-payment:update']))
const canDelete = computed(() => hasAccessByCodes(['erp:finance-payment:delete']))
const canUpdateStatus = computed(() => hasAccessByCodes(['erp:finance-payment:update-status']) && (formData.value?.status === 10 || formData.value?.status === 20))
const nextStatus = computed(() => formData.value?.status === 10 ? 20 : 10)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/finance/payment/index')
}

function getBizTypeName(value?: number) {
  if (value === ERP_BIZ_TYPE.PURCHASE_IN) {
    return '采购入库'
  }
  if (value === ERP_BIZ_TYPE.PURCHASE_RETURN) {
    return '采购退货'
  }
  return '-'
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await enrichErpDocumentDetail(await getFinancePayment(Number(currentId.value)), 'finance-payment')
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/finance/payment/form/index?id=${currentId.value}` })
}

// TODO @AI：注释；
function handleOpenFile() {
  if (formData.value?.fileUrl) {
    openErpFile(formData.value.fileUrl)
  }
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该付款单吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteFinancePayment([Number(currentId.value)])
    toast.success('删除成功')
    uni.$emit('erp:finance-payment:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 审批或反审批 */
async function handleUpdateStatus(status: number) {
  if (!currentId.value) {
    return
  }
  // TODO @AI：magic number；
  const actionName = status === 20 ? '审批' : '反审批'
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${actionName}该付款单吗？` })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updateFinancePaymentStatus(Number(currentId.value), status)
    toast.success(`${actionName}成功`)
    uni.$emit('erp:finance-payment:reload')
    await getDetail()
  } finally {
    statusLoading.value = false
  }
}

onMounted(() => {
  getDetail()
  uni.$on('erp:finance-payment:reload', getDetail)
})

onUnload(() => {
  uni.$off('erp:finance-payment:reload', getDetail)
})

// TODO @AI：这个也参考别的 details 搞；
watch(currentId, () => {
  formData.value = undefined
  void getDetail()
})
</script>
