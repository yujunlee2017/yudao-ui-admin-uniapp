<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="采购退货详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="退货单号" :value="formData?.no || '-'" />
        <wd-cell title="供应商" :value="formData?.supplierName || '-'" />
        <wd-cell title="退货时间" :value="formatDateTime(formData?.returnTime) || '-'" />
        <wd-cell title="关联订单" :value="formData?.orderNo || '-'" />
        <wd-cell title="创建人" :value="formData?.creatorName || '-'" />
        <wd-cell title="审核状态">
          <dict-tag :type="DICT_TYPE.ERP_AUDIT_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="总数量" :value="formatCount(formData?.totalCount)" />
        <wd-cell title="优惠率(%)" :value="formatPercent(formData?.discountPercent)" />
        <wd-cell title="退款优惠" :value="formatMoney(formData?.discountPrice)" />
        <wd-cell title="其它费用" :value="formatMoney(formData?.otherPrice)" />
        <wd-cell title="应退金额" :value="formatMoney(formData?.totalPrice)" />
        <wd-cell title="已退金额" :value="formatMoney(formData?.refundPrice)" />
        <wd-cell title="未退金额" :value="formatMoney(unrefundedPrice)" />
        <wd-cell title="结算账户" :value="formData?.accountName || '-'" />
        <wd-cell title="附件" :value="formData?.fileUrl ? '查看附件' : '-'" :is-link="!!formData?.fileUrl" @click="handleOpenFile" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 退货明细 -->
      <ErpDetailItems title="退货产品清单" :items="items" :fields="itemFields" />

      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <!-- TODO @Yunai：不做 ErpAuditActions 统一封装，参考其它模块把底部操作写回各自详情页。 -->
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
import type { PurchaseReturn } from '@/api/erp/purchase/return'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { deletePurchaseReturn, getPurchaseReturn, updatePurchaseReturnStatus } from '@/api/erp/purchase/return'
import { useAccess } from '@/hooks/useAccess'
import ErpDetailItems from '@/pages-erp/components/erp-detail-items.vue'
import ErpAuditActions from '@/pages-erp/components/erp-audit-actions.vue'
import type { ErpDetailItemField } from '@/pages-erp/components/types'
import { enrichErpDocumentDetail, formatCount, formatMoney, formatPercent, openErpFile } from '@/pages-erp/utils'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-erp/purchase/return/detail/index')
// TODO @Yunai：对齐 system 页面，直接用 props.id 接参，删除 useRouteQuery/currentId 包装。
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
// TODO @Yunai：状态变量缺尾注释，按 AGENTS.md 补 // 详情数据、// 删除状态、// 审批提交状态。
const formData = ref<PurchaseReturn>()
const deleting = ref(false)
const statusLoading = ref(false)
const items = computed(() => Array.isArray(formData.value?.items) ? formData.value.items : [])
// TODO @Yunai：明细字段按 AGENTS 改成逐字段模板，不再通过 itemFields 配置生成。
const itemFields: ErpDetailItemField[] = [
  { prop: 'warehouseName', label: '仓库' },
  { prop: 'productName', label: '产品' },
  { prop: 'productBarCode', label: '条码' },
  { prop: 'productUnitName', label: '单位' },
  { prop: 'inCount', label: '已入库', type: 'count', hiddenWhenEmpty: true },
  { prop: 'returnCount', label: '已退货', type: 'count', hiddenWhenEmpty: true },
  { prop: 'count', label: '数量', type: 'count' },
  { prop: 'productPrice', label: '采购单价', type: 'money' },
  { prop: 'totalProductPrice', label: '金额', type: 'money' },
  { prop: 'taxPercent', label: '税率', type: 'percent' },
  { prop: 'taxPrice', label: '税额', type: 'money' },
  { prop: 'totalPrice', label: '含税金额', type: 'money' },
  { prop: 'remark', label: '备注', hiddenWhenEmpty: true },
] // 退货明细字段
const unrefundedPrice = computed(() => Number(formData.value?.totalPrice || 0) - Number(formData.value?.refundPrice || 0))
// TODO @Yunai：审批状态魔法数字 10/20 改 ErpAuditStatusEnum（同 purchase/order/detail，4 处）
const canUpdate = computed(() => formData.value?.status !== 20 && hasAccessByCodes(['erp:purchase-return:update']))
const canDelete = computed(() => hasAccessByCodes(['erp:purchase-return:delete']))
const canUpdateStatus = computed(() => hasAccessByCodes(['erp:purchase-return:update-status']) && (formData.value?.status === 10 || formData.value?.status === 20))
const nextStatus = computed(() => formData.value?.status === 10 ? 20 : 10)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/purchase/return/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await enrichErpDocumentDetail(await getPurchaseReturn(Number(currentId.value)), 'purchase-return') as PurchaseReturn
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/purchase/return/form/index?id=${currentId.value}` })
}

// TODO @Yunai：补 /** 打开附件 */ JSDoc。
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
    await dialog.confirm({ title: '提示', msg: '确定要删除该采购退货吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePurchaseReturn([Number(currentId.value)])
    toast.success('删除成功')
    uni.$emit('erp:purchase-return:reload')
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
  // TODO @Yunai：审批状态 20 改用 ErpAuditStatusEnum.AUDITED。
  const actionName = status === 20 ? '审批' : '反审批'
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${actionName}该采购退货吗？` })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updatePurchaseReturnStatus(Number(currentId.value), status)
    toast.success(`${actionName}成功`)
    uni.$emit('erp:purchase-return:reload')
    await getDetail()
  } finally {
    statusLoading.value = false
  }
}

onMounted(() => {
  getDetail()
  uni.$on('erp:purchase-return:reload', getDetail)
})

onUnload(() => {
  uni.$off('erp:purchase-return:reload', getDetail)
})

// TODO @Yunai：watch currentId 对齐其它 detail，补 /** */ 注释并统一初始化/路由变化刷新写法。
watch(currentId, () => {
  formData.value = undefined
  void getDetail()
})
</script>
