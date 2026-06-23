<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="库存调拨详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="调拨单号" :value="formData?.no || '-'" />
        <wd-cell title="调拨时间" :value="formatDateTime(formData?.moveTime) || '-'" />
        <wd-cell title="创建人" :value="formData?.creatorName || '-'" />
        <wd-cell title="审核状态">
          <dict-tag :type="DICT_TYPE.ERP_AUDIT_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="合计数量" :value="formatCount(formData?.totalCount)" />
        <wd-cell title="合计金额" :value="formatMoney(formData?.totalPrice)" />
        <wd-cell title="附件" :value="formData?.fileUrl ? '查看附件' : '-'" :is-link="!!formData?.fileUrl" @click="handleOpenFile" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 调拨明细 -->
      <ErpDetailItems title="调拨产品清单" :items="items" :fields="itemFields" />

      <!-- 底部安全区域 -->
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
import type { StockMove } from '@/api/erp/stock/move'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { deleteStockMove, getStockMove, updateStockMoveStatus } from '@/api/erp/stock/move'
import { useAccess } from '@/hooks/useAccess'
import ErpDetailItems from '@/pages-erp/components/erp-detail-items.vue'
import ErpAuditActions from '@/pages-erp/components/erp-audit-actions.vue'
import type { ErpDetailItemField } from '@/pages-erp/components/types'
import { enrichErpDocumentDetail, formatCount, formatMoney, openErpFile } from '@/pages-erp/utils'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-erp/stock/move/detail/index')
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
const formData = ref<StockMove>() // 详情数据
const deleting = ref(false) // 删除状态
const statusLoading = ref(false) // 审批状态
const items = computed(() => Array.isArray(formData.value?.items) ? formData.value.items : [])
const itemFields: ErpDetailItemField[] = [
  { prop: 'fromWarehouseName', label: '调出仓库' },
  { prop: 'toWarehouseName', label: '调入仓库' },
  { prop: 'productName', label: '产品' },
  { prop: 'productBarCode', label: '条码' },
  { prop: 'productUnitName', label: '单位' },
  { prop: 'count', label: '数量', type: 'count' },
  { prop: 'productPrice', label: '产品单价', type: 'money' },
  { prop: 'totalPrice', label: '合计金额', type: 'money' },
  { prop: 'remark', label: '备注', hiddenWhenEmpty: true },
] // 调拨明细字段
const canUpdate = computed(() => formData.value?.status !== 20 && hasAccessByCodes(['erp:stock-move:update']))
const canDelete = computed(() => hasAccessByCodes(['erp:stock-move:delete']))
const canUpdateStatus = computed(() => hasAccessByCodes(['erp:stock-move:update-status']) && (formData.value?.status === 10 || formData.value?.status === 20))
const nextStatus = computed(() => formData.value?.status === 10 ? 20 : 10)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/stock/move/index')
}

/** 加载库存调拨详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await enrichErpDocumentDetail(await getStockMove(Number(currentId.value)), 'stock-move') as StockMove
  } finally {
    toast.close()
  }
}

/** 编辑库存调拨 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/stock/move/form/index?id=${currentId.value}` })
}

/** 打开附件 */
function handleOpenFile() {
  if (formData.value?.fileUrl) {
    openErpFile(formData.value.fileUrl)
  }
}

/** 删除库存调拨 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该库存调拨吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteStockMove([Number(currentId.value)])
    toast.success('删除成功')
    uni.$emit('erp:stock-move:reload')
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
    await dialog.confirm({ title: '提示', msg: `确定要${actionName}该库存调拨吗？` })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updateStockMoveStatus(Number(currentId.value), status)
    toast.success(`${actionName}成功`)
    uni.$emit('erp:stock-move:reload')
    await getDetail()
  } finally {
    statusLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('erp:stock-move:reload', getDetail)
})

watch(currentId, () => {
  formData.value = undefined
  void getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:stock-move:reload', getDetail)
})
</script>
