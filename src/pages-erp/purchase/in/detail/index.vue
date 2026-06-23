<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="采购入库详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="入库单号" :value="formData?.no || '-'" />
        <wd-cell title="供应商" :value="formData?.supplierName || '-'" />
        <wd-cell title="入库时间" :value="formatDateTime(formData?.inTime) || '-'" />
        <wd-cell title="关联订单" :value="formData?.orderNo || '-'" />
        <wd-cell title="创建人" :value="formData?.creatorName || '-'" />
        <wd-cell title="审核状态">
          <dict-tag :type="DICT_TYPE.ERP_AUDIT_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="总数量" :value="formatCount(formData?.totalCount)" />
        <wd-cell title="优惠率(%)" :value="formatPercent(formData?.discountPercent)" />
        <wd-cell title="付款优惠" :value="formatMoney(formData?.discountPrice)" />
        <wd-cell title="其它费用" :value="formatMoney(formData?.otherPrice)" />
        <wd-cell title="应付金额" :value="formatMoney(formData?.totalPrice)" />
        <wd-cell title="已付金额" :value="formatMoney(formData?.paymentPrice)" />
        <wd-cell title="未付金额" :value="formatMoney(unpaidPrice)" />
        <wd-cell title="结算账户" :value="formData?.accountName || '-'" />
        <wd-cell title="附件" :value="formData?.fileUrl ? '查看附件' : '-'" :is-link="!!formData?.fileUrl" @click="handleOpenFile" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 入库明细 -->
      <ErpDetailItems title="入库产品清单" :items="items" :fields="itemFields" />

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
import type { PurchaseIn } from '@/api/erp/purchase/in'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { deletePurchaseIn, getPurchaseIn, updatePurchaseInStatus } from '@/api/erp/purchase/in'
import { useAccess } from '@/hooks/useAccess'
import ErpDetailItems from '@/pages-erp/components/erp-detail-items.vue'
import ErpAuditActions from '@/pages-erp/components/erp-audit-actions.vue'
import type { ErpDetailItemField } from '@/pages-erp/components/types'
import { enrichErpDocumentDetail, formatCount, formatMoney, formatPercent, openErpFile } from '@/pages-erp/utils'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-erp/purchase/in/detail/index')
const currentId = computed(() => getRouteQueryNumber('id'))

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<PurchaseIn>()
const deleting = ref(false)
const statusLoading = ref(false)
const items = computed(() => Array.isArray(formData.value?.items) ? formData.value.items : [])
const itemFields: ErpDetailItemField[] = [
  { prop: 'warehouseName', label: '仓库' },
  { prop: 'productName', label: '产品' },
  { prop: 'productBarCode', label: '条码' },
  { prop: 'productUnitName', label: '单位' },
  { prop: 'totalCount', label: '原数量', type: 'count', hiddenWhenEmpty: true },
  { prop: 'inCount', label: '已入库', type: 'count', hiddenWhenEmpty: true },
  { prop: 'count', label: '数量', type: 'count' },
  { prop: 'productPrice', label: '采购单价', type: 'money' },
  { prop: 'totalProductPrice', label: '金额', type: 'money' },
  { prop: 'taxPercent', label: '税率', type: 'percent' },
  { prop: 'taxPrice', label: '税额', type: 'money' },
  { prop: 'totalPrice', label: '含税金额', type: 'money' },
  { prop: 'remark', label: '备注', hiddenWhenEmpty: true },
] // 入库明细字段
const unpaidPrice = computed(() => Number(formData.value?.totalPrice || 0) - Number(formData.value?.paymentPrice || 0))
const canUpdate = computed(() => formData.value?.status !== 20 && hasAccessByCodes(['erp:purchase-in:update']))
const canDelete = computed(() => hasAccessByCodes(['erp:purchase-in:delete']))
const canUpdateStatus = computed(() => hasAccessByCodes(['erp:purchase-in:update-status']) && (formData.value?.status === 10 || formData.value?.status === 20))
const nextStatus = computed(() => formData.value?.status === 10 ? 20 : 10)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/purchase/in/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await enrichErpDocumentDetail(await getPurchaseIn(Number(currentId.value)), 'purchase-in')
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/purchase/in/form/index?id=${currentId.value}` })
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
    await dialog.confirm({ title: '提示', msg: '确定要删除该采购入库吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePurchaseIn([Number(currentId.value)])
    toast.success('删除成功')
    uni.$emit('erp:purchase-in:reload')
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
  const actionName = status === 20 ? '审批' : '反审批'
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${actionName}该采购入库吗？` })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updatePurchaseInStatus(Number(currentId.value), status)
    toast.success(`${actionName}成功`)
    uni.$emit('erp:purchase-in:reload')
    await getDetail()
  } finally {
    statusLoading.value = false
  }
}

onMounted(() => {
  getDetail()
  uni.$on('erp:purchase-in:reload', getDetail)
})

onUnload(() => {
  uni.$off('erp:purchase-in:reload', getDetail)
})
watch(currentId, () => {
  formData.value = undefined
  void getDetail()
})
</script>
