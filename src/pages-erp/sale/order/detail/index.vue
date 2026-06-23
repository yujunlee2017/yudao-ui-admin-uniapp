<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="销售订单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="订单单号" :value="formData?.no || '-'" />
        <wd-cell title="客户" :value="formData?.customerName || '-'" />
        <wd-cell title="订单时间" :value="formatDateTime(formData?.orderTime) || '-'" />
        <wd-cell title="创建人" :value="formData?.creatorName || '-'" />
        <wd-cell title="销售人员" :value="formData?.saleUserName || '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.ERP_AUDIT_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="总数量" :value="formatCount(formData?.totalCount)" />
        <wd-cell title="出库数量" :value="formatCount(formData?.outCount)" />
        <wd-cell title="退货数量" :value="formatCount(formData?.returnCount)" />
        <wd-cell title="金额合计" :value="formatMoney(formData?.totalProductPrice)" />
        <wd-cell title="优惠率(%)" :value="formatPercent(formData?.discountPercent)" />
        <wd-cell title="收款优惠" :value="formatMoney(formData?.discountPrice)" />
        <wd-cell title="含税金额" :value="formatMoney(formData?.totalPrice)" />
        <wd-cell title="收取订金" :value="formatMoney(formData?.depositPrice)" />
        <wd-cell title="结算账户" :value="formData?.accountName || '-'" />
        <wd-cell
          title="附件"
          :value="formData?.fileUrl ? '查看附件' : '-'"
          :is-link="!!formData?.fileUrl"
          @click="handleOpenFile"
        />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <!-- 产品明细 -->
      <ErpDetailItems title="订单产品清单" :items="items" :fields="itemFields" />

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
import type { SaleOrder } from '@/api/erp/sale/order'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { deleteSaleOrder, getSaleOrder, updateSaleOrderStatus } from '@/api/erp/sale/order'
import { useAccess } from '@/hooks/useAccess'
import ErpDetailItems from '@/pages-erp/components/erp-detail-items.vue'
import ErpAuditActions from '@/pages-erp/components/erp-audit-actions.vue'
import type { ErpDetailItemField } from '@/pages-erp/components/types'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { enrichErpDocumentDetail, formatCount, formatMoney, formatPercent, openErpFile } from '@/pages-erp/utils'

const props = defineProps<{ id?: number | any }>()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-erp/sale/order/detail/index')
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
const formData = ref<SaleOrder>() // 详情数据
const deleting = ref(false) // 删除状态
const statusLoading = ref(false) // 审批状态
const items = computed(() => Array.isArray(formData.value?.items) ? formData.value.items : [])
const itemFields: ErpDetailItemField[] = [
  { prop: 'productName', label: '产品' },
  { prop: 'productBarCode', label: '条码' },
  { prop: 'productUnitName', label: '单位' },
  { prop: 'count', label: '数量', type: 'count' },
  { prop: 'productPrice', label: '产品单价', type: 'money' },
  { prop: 'totalProductPrice', label: '金额', type: 'money' },
  { prop: 'taxPercent', label: '税率', type: 'percent' },
  { prop: 'taxPrice', label: '税额', type: 'money' },
  { prop: 'totalPrice', label: '含税金额', type: 'money' },
  { prop: 'remark', label: '备注', hiddenWhenEmpty: true },
] // 产品明细字段
const canUpdate = computed(() => formData.value?.status !== 20 && hasAccessByCodes(['erp:sale-order:update']))
const canDelete = computed(() => hasAccessByCodes(['erp:sale-order:delete']))
const canUpdateStatus = computed(() => hasAccessByCodes(['erp:sale-order:update-status']) && (formData.value?.status === 10 || formData.value?.status === 20))
const nextStatus = computed(() => formData.value?.status === 10 ? 20 : 10)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/sale/order/index')
}

/** 加载销售订单详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await enrichErpDocumentDetail(await getSaleOrder(Number(currentId.value)), 'sale-order')
  } finally {
    toast.close()
  }
}

/** 编辑销售订单 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-erp/sale/order/form/index?id=${currentId.value}` })
}

/** 打开附件 */
function handleOpenFile() {
  if (formData.value?.fileUrl) {
    openErpFile(formData.value.fileUrl)
  }
}

/** 删除销售订单 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该销售订单吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteSaleOrder([Number(currentId.value)])
    toast.success('删除成功')
    uni.$emit('erp:sale-order:reload')
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
    await dialog.confirm({
      title: '提示',
      msg: `确定要${actionName}该销售订单吗？`,
    })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updateSaleOrderStatus(Number(currentId.value), status)
    toast.success(`${actionName}成功`)
    uni.$emit('erp:sale-order:reload')
    await getDetail()
  } finally {
    statusLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('erp:sale-order:reload', getDetail)
})

watch(currentId, () => {
  formData.value = undefined
  void getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:sale-order:reload', getDetail)
})
</script>
