<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="合同详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情分类 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <template v-if="activeTab === 'basic'">
      <wd-cell-group border>
        <template v-for="field in detailFields" :key="field.prop">
          <wd-cell v-if="field.dictType" :title="field.label">
            <dict-tag v-if="hasValue(field.prop)" :type="field.dictType" :value="formData[field.prop]" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell v-else :title="field.label" :value="formatValue(field)" />
        </template>
      </wd-cell-group>

      <!-- 产品清单（只读） -->
      <view class="mt-24rpx bg-white">
        <view class="flex items-center justify-between px-24rpx py-20rpx">
          <text class="text-30rpx text-[#333] font-semibold">产品清单</text>
        </view>
        <view v-for="(row, index) in products" :key="index" class="border-t border-[#f5f5f5] px-24rpx py-20rpx">
          <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
            {{ row.productName || '-' }}
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">产品编码：</text>
            <text class="line-clamp-1">{{ row.productNo || '-' }}</text>
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">数量：</text>
            <text class="line-clamp-1">{{ row.count ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">合同价：</text>
            <text class="line-clamp-1">{{ formatMoney(row.contractPrice) }}</text>
          </view>
          <view class="flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">合计：</text>
            <text class="line-clamp-1">{{ formatMoney(row.totalPrice) }}</text>
          </view>
        </view>
        <wd-empty v-if="products.length === 0" icon="content" tip="暂无产品" />
      </view>
    </template>

    <!-- 跟进记录 -->
    <CrmFollowupRecords v-else-if="activeTab === 'followup' && contractId" ref="followupRef" embedded :biz-id="contractId" :biz-type="bizType" />

    <!-- 团队成员 -->
    <CrmPermissionTeam v-else-if="activeTab === 'team' && contractId" ref="teamRef" embedded :biz-id="contractId" :biz-type="bizType" @quit-team="handleQuitTeam" @can-quit-change="(v: boolean) => teamCanQuit = v" />

    <!-- 回款计划 -->
    <ReceivablePlanList v-else-if="activeTab === 'plans' && contractId" ref="listRef" :customer-id="formData.customerId" :contract-id="contractId" />

    <!-- 回款 -->
    <ReceivableList v-else-if="activeTab === 'receivables' && contractId" ref="listRef" :customer-id="formData.customerId" :contract-id="contractId" />

    <!-- 操作日志 -->
    <CrmOperateLogs v-else-if="activeTab === 'log' && contractId" :biz-id="contractId" :biz-type="bizType" />

    <!-- 底部操作（按 tab 区分，只放当前模块的操作） -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="activeTab === 'basic'">
          <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="handleEdit">
            编辑
          </wd-button>
          <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
            删除
          </wd-button>
          <wd-button v-if="moreActions.length" class="flex-1" type="info" @click="moreActionVisible = true">
            更多
          </wd-button>
        </template>
        <wd-button v-else-if="activeTab === 'followup'" class="flex-1" type="primary" @click="followupRef?.openAdd()">
          写跟进
        </wd-button>
        <template v-else-if="activeTab === 'team'">
          <wd-button v-if="teamCanQuit" class="flex-1" type="danger" variant="plain" @click="teamRef?.quit()">
            退出团队
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="teamRef?.openAdd()">
            新增成员
          </wd-button>
        </template>
        <wd-button v-else-if="activeTab === 'plans' && canCreatePlan" class="flex-1" type="primary" @click="listRef?.openAdd()">
          新增回款计划
        </wd-button>
        <wd-button v-else-if="activeTab === 'receivables' && canCreateReceivable" class="flex-1" type="primary" @click="listRef?.openAdd()">
          新增回款
        </wd-button>
      </view>
    </view>

    <!-- 业务操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />

    <!-- 转移 -->
    <CrmTransferForm ref="transferFormRef" :biz-type="bizType" @success="getDetail" />
  </view>
</template>

<script lang="ts" setup>
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteContract, getContract, submitContract } from '@/api/crm/contract'
import { BizTypeEnum } from '@/api/crm/permission'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import CrmFollowupRecords from '@/pages-crm/followup/components/followup-list.vue'
import CrmOperateLogs from '@/pages-crm/operate-log/components/operate-log-list.vue'
import CrmPermissionTeam from '@/pages-crm/permission/components/permission-list.vue'
import CrmTransferForm from '@/pages-crm/permission/components/transfer-form.vue'
import ReceivableList from '@/pages-crm/receivable/components/receivable-list.vue'
import ReceivablePlanList from '@/pages-crm/receivable-plan/components/receivable-plan-list.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const bizType = BizTypeEnum.CRM_CONTRACT
const tabs: { key: string, title: string }[] = [ // tab 配置
  { key: 'basic', title: '基本信息' },
  { key: 'followup', title: '跟进记录' },
  { key: 'team', title: '团队成员' },
  { key: 'plans', title: '回款计划' },
  { key: 'receivables', title: '回款' },
  { key: 'log', title: '操作日志' },
]
const detailFields: { label: string, prop: string, dictType?: string, type?: 'date' | 'datetime' | 'money' }[] = [ // 基本信息字段
  { label: '合同编号', prop: 'no' },
  { label: '合同名称', prop: 'name' },
  { label: '客户名称', prop: 'customerName' },
  { label: '商机名称', prop: 'businessName' },
  { label: '负责人', prop: 'ownerUserName' },
  { label: '下单日期', prop: 'orderDate', type: 'date' },
  { label: '开始时间', prop: 'startTime', type: 'date' },
  { label: '结束时间', prop: 'endTime', type: 'date' },
  { label: '公司签约人', prop: 'signUserName' },
  { label: '客户签约人', prop: 'signContactName' },
  { label: '审批状态', prop: 'auditStatus', dictType: DICT_TYPE.CRM_AUDIT_STATUS },
  { label: '合同金额', prop: 'totalPrice', type: 'money' },
  { label: '整单折扣(%)', prop: 'discountPercent' },
  { label: '已回款金额', prop: 'totalReceivablePrice', type: 'money' },
  { label: '备注', prop: 'remark' },
  { label: '创建时间', prop: 'createTime', type: 'datetime' },
]

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Record<string, any>>({}) // 详情数据
const tabIndex = ref(0) // 当前详情分类下标
const deleting = ref(false) // 删除状态
const actionLoading = ref(false) // 业务操作状态
const moreActionVisible = ref(false) // 业务操作菜单显示状态
const teamCanQuit = ref(false) // 是否可退出团队
const followupRef = ref<{ openAdd: () => void }>() // 跟进记录引用
const teamRef = ref<{ openAdd: () => void, quit: () => void }>() // 团队成员引用
const listRef = ref<{ openAdd: () => void }>() // 当前关联列表引用
const transferFormRef = ref<InstanceType<typeof CrmTransferForm>>() // 转移表单引用
const contractId = computed(() => Number(props.id))
const products = computed<Record<string, any>[]>(() => Array.isArray(formData.value.products) ? formData.value.products : [])
const activeTab = computed(() => tabs[tabIndex.value].key)
const canUpdate = computed(() => hasAccessByCodes(['crm:contract:update']))
const canDelete = computed(() => hasAccessByCodes(['crm:contract:delete']))
const canCreatePlan = computed(() => hasAccessByCodes(['crm:receivable-plan:create']))
const canCreateReceivable = computed(() => hasAccessByCodes(['crm:receivable:create']))
const moreActions = computed(() => {
  const data = formData.value
  if (!data?.id) {
    return []
  }
  const actions = [
    { name: '转移', value: 'transfer' },
    { name: '提交审核', value: 'submit' },
  ]
  if (data.processInstanceId) {
    actions.push({ name: '查看审批', value: 'viewProcess' })
  }
  return actions
})
const hasFooter = computed(() => {
  switch (activeTab.value) {
    case 'log':
      return false
    case 'basic':
      return canUpdate.value || canDelete.value || moreActions.value.length > 0
    case 'followup':
      return true
    case 'team':
      return true
    case 'plans':
      return canCreatePlan.value
    case 'receivables':
      return canCreateReceivable.value
    default:
      return false
  }
})

/** 字段是否有值 */
function hasValue(prop: string) {
  const value = formData.value[prop]
  return value !== undefined && value !== null && value !== ''
}

/** 格式化基本信息字段值 */
function formatValue(field: { prop: string, type?: 'date' | 'datetime' | 'money' }) {
  const value = formData.value[field.prop]
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (field.type === 'datetime') {
    return formatDateTime(value) || '-'
  }
  if (field.type === 'date') {
    return formatDate(value) || '-'
  }
  if (field.type === 'money') {
    return formatMoney(value)
  }
  return String(value)
}

/** 格式化金额 */
function formatMoney(value: any) {
  const amount = Number(value)
  return Number.isNaN(amount) ? '-' : amount.toFixed(2)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/contract/index')
}

/** 加载详情 */
async function getDetail() {
  if (!contractId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getContract(contractId.value)
  } finally {
    toast.close()
  }
}

/** 执行业务操作（确认 → 调用 → 刷新） */
async function runAction(message: string, action: () => Promise<any>, successMessage: string) {
  try {
    await dialog.confirm({ title: '提示', msg: message })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await action()
    toast.success(successMessage)
    uni.$emit('crm:contract:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 业务操作菜单选择 */
function handleMoreAction({ item }: { item: { value: string } }) {
  const handlers: Record<string, () => void> = {
    transfer: handleTransfer,
    submit: handleSubmit,
    viewProcess: handleViewProcess,
  }
  handlers[item.value]?.()
}

/** 转移 */
function handleTransfer() {
  transferFormRef.value?.open(contractId.value)
}

/** 提交审核 */
function handleSubmit() {
  runAction(
    `确定提交合同【${formData.value.name || formData.value.no || ''}】审核吗？`,
    () => submitContract(contractId.value),
    '提交审核成功',
  )
}

/** 查看审批 */
function handleViewProcess() {
  const processInstanceId = formData.value.processInstanceId
  if (!processInstanceId) {
    toast.show('暂无审批流程')
    return
  }
  uni.navigateTo({ url: `/pages-bpm/processInstance/detail/index?id=${processInstanceId}` })
}

/** 退出团队后返回 */
function handleQuitTeam() {
  uni.$emit('crm:contract:reload')
  setTimeout(() => handleBack(), 500)
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/contract/form/index?id=${contractId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!contractId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该合同吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteContract(contractId.value)
    toast.success('删除成功')
    uni.$emit('crm:contract:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:contract:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:contract:reload', getDetail)
})
</script>
