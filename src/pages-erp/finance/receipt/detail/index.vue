<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="收款单详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="收款单号" :value="formData?.no || '-'" />
        <wd-cell title="客户" :value="formData?.customerName || '-'" />
        <wd-cell title="收款时间" :value="formatDateTime(formData?.receiptTime) || '-'" />
        <wd-cell title="创建人" :value="formData?.creatorName || '-'" />
        <wd-cell title="财务人员" :value="formData?.financeUserName || '-'" />
        <wd-cell title="收款账户" :value="formData?.accountName || '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.ERP_AUDIT_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="合计收款" :value="formatMoney(formData?.totalPrice)" />
        <wd-cell title="优惠金额" :value="formatMoney(formData?.discountPrice)" />
        <wd-cell title="实际收款" :value="formatMoney(formData?.receiptPrice)" />
        <wd-cell title="附件" :value="formData?.fileUrl ? '查看附件' : '-'" :is-link="!!formData?.fileUrl" @click="handleOpenFile" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 收款明细 -->
      <ErpDetailItems title="收款明细" :items="items" :fields="itemFields" />

      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
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
import type { FinanceReceipt } from '@/api/erp/finance/receipt'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { deleteFinanceReceipt, getFinanceReceipt, updateFinanceReceiptStatus } from '@/api/erp/finance/receipt'
import { useAccess } from '@/hooks/useAccess'
import ErpDetailItems from '@/pages-erp/components/erp-detail-items.vue'
import ErpAuditActions from '@/pages-erp/components/erp-audit-actions.vue'
import type { ErpDetailItemField } from '@/pages-erp/components/types'
import { enrichErpDocumentDetail, formatMoney, openErpFile } from '@/pages-erp/utils'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-erp/finance/receipt/detail/index')
const currentId = computed(() => getRouteQueryNumber('id'))

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const ERP_BIZ_TYPE = {
  SALE_OUT: 21,
  SALE_RETURN: 22,
} as const

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<FinanceReceipt>()
const deleting = ref(false)
const statusLoading = ref(false)
const items = computed(() => Array.isArray(formData.value?.items) ? formData.value.items : [])
const itemFields: ErpDetailItemField[] = [
  { prop: 'bizNo', label: '销售单据编号' },
  { prop: 'bizType', label: '销售业务类型', formatter: value => getBizTypeName(value) },
  { prop: 'totalPrice', label: '应收金额', type: 'money' },
  { prop: 'receiptedPrice', label: '已收金额', type: 'money' },
  { prop: 'receiptPrice', label: '本次收款', type: 'money' },
  { prop: 'remark', label: '备注', hiddenWhenEmpty: true },
] // 收款明细字段
const canUpdate = computed(() => formData.value?.status !== 20 && hasAccessByCodes(['erp:finance-receipt:update']))
const canDelete = computed(() => hasAccessByCodes(['erp:finance-receipt:delete']))
const canUpdateStatus = computed(() => hasAccessByCodes(['erp:finance-receipt:update-status']) && (formData.value?.status === 10 || formData.value?.status === 20))
const nextStatus = computed(() => formData.value?.status === 10 ? 20 : 10)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/finance/receipt/index')
}

function getBizTypeName(value?: number) {
  if (value === ERP_BIZ_TYPE.SALE_OUT) {
    return '销售出库'
  }
  if (value === ERP_BIZ_TYPE.SALE_RETURN) {
    return '销售退货'
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
    formData.value = await enrichErpDocumentDetail(await getFinanceReceipt(Number(currentId.value)), 'finance-receipt')
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/finance/receipt/form/index?id=${currentId.value}` })
}

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
    await dialog.confirm({ title: '提示', msg: '确定要删除该收款单吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteFinanceReceipt([Number(currentId.value)])
    toast.success('删除成功')
    uni.$emit('erp:finance-receipt:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 审批或反审批 */
async function handleUpdateStatus(status: number) {
  if (!currentId.value) {
    return
  }
  const actionName = status === 20 ? '审批' : '反审批'
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${actionName}该收款单吗？` })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updateFinanceReceiptStatus(Number(currentId.value), status)
    toast.success(`${actionName}成功`)
    uni.$emit('erp:finance-receipt:reload')
    await getDetail()
  } finally {
    statusLoading.value = false
  }
}

onMounted(() => {
  getDetail()
  uni.$on('erp:finance-receipt:reload', getDetail)
})

onUnload(() => {
  uni.$off('erp:finance-receipt:reload', getDetail)
})
watch(currentId, () => {
  formData.value = undefined
  void getDetail()
})
</script>
