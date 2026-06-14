<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商机详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情分类 -->
    <!-- TODO @AI：tabs 都是 。。。customer detail 是不会的。 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <template v-if="activeTab === 'basic'">
      <wd-cell-group border>
        <wd-cell title="商机名称" :value="formData.name || '-'" />
        <wd-cell title="客户名称" :value="formData.customerName || '-'" />
        <wd-cell title="负责人" :value="formData.ownerUserName || '-'" />
        <wd-cell title="商机状态组" :value="formData.statusTypeName || '-'" />
        <wd-cell title="商机阶段" :value="formData.statusName || '-'" />
        <wd-cell title="预计成交日期" :value="formatDate(formData.dealTime) || '-'" />
        <wd-cell title="商机金额" :value="formData.totalPrice != null && formData.totalPrice !== '' ? formatMoney(formData.totalPrice) : '-'" />
        <wd-cell title="整单折扣(%)" :value="formData.discountPercent || '-'" />
        <wd-cell title="备注" :value="formData.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>

      <!-- 产品清单（只读） -->
      <view class="mt-24rpx bg-white">
        <view class="px-24rpx py-20rpx">
          <text class="text-30rpx text-[#333] font-semibold">产品清单</text>
        </view>
        <view
          v-for="(row, index) in formData.products || []"
          :key="index"
          class="mx-24rpx mb-20rpx rounded-12rpx bg-[#f7f8fa] p-24rpx"
        >
          <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
            {{ row.productName || '-' }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">产品编码：</text>{{ row.productNo || '-' }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">数量：</text>{{ row.count ?? '-' }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">售价：</text>{{ formatMoney(row.businessPrice) }}
          </view>
          <view class="text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">合计：</text>{{ formatMoney(row.totalPrice) }}
          </view>
        </view>
        <wd-empty v-if="!(formData.products && formData.products.length)" icon="content" tip="暂无产品" />
      </view>
    </template>

    <!-- 跟进记录 -->
    <CrmFollowupRecords v-else-if="activeTab === 'followup' && businessId" ref="followupRef" embedded :biz-id="businessId" :biz-type="bizType" />

    <!-- 联系人 -->
    <ContactList v-else-if="activeTab === 'contacts' && businessId" ref="listRef" :business-id="businessId" :customer-id="formData.customerId" />

    <!-- 团队成员 -->
    <CrmPermissionTeam v-else-if="activeTab === 'team' && businessId" ref="teamRef" embedded :biz-id="businessId" :biz-type="bizType" @quit-team="handleQuitTeam" @can-quit-change="(v: boolean) => teamCanQuit = v" />

    <!-- 合同 -->
    <ContractList v-else-if="activeTab === 'contracts' && businessId" ref="listRef" :business-id="businessId" />

    <!-- 操作日志 -->
    <CrmOperateLogs v-else-if="activeTab === 'log' && businessId" :biz-id="businessId" :biz-type="bizType" />

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
        <wd-button v-else-if="activeTab === 'contacts'" class="flex-1" type="primary" @click="listRef?.openAdd()">
          新增联系人
        </wd-button>
        <template v-else-if="activeTab === 'team'">
          <wd-button v-if="teamCanQuit" class="flex-1" type="danger" variant="plain" @click="teamRef?.quit()">
            退出团队
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="teamRef?.openAdd()">
            新增成员
          </wd-button>
        </template>
        <wd-button v-else-if="activeTab === 'contracts'" class="flex-1" type="primary" @click="listRef?.openAdd()">
          新增合同
        </wd-button>
      </view>
    </view>

    <!-- 业务操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />

    <!-- 转移 -->
    <CrmTransferForm ref="transferFormRef" :biz-type="bizType" @success="getDetail" />

    <!-- 变更商机状态 -->
    <CrmBusinessStatusForm ref="businessStatusFormRef" @success="getDetail" />
  </view>
</template>

<script lang="ts" setup>
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteBusiness, getBusiness } from '@/api/crm/business'
import { BizTypeEnum } from '@/api/crm/permission'
import { useAccess } from '@/hooks/useAccess'
import CrmBusinessStatusForm from '@/pages-crm/business/components/business-status-form.vue'
import ContactList from '@/pages-crm/contact/components/contact-list.vue'
import ContractList from '@/pages-crm/contract/components/contract-list.vue'
import CrmFollowupRecords from '@/pages-crm/followup/components/followup-list.vue'
import CrmOperateLogs from '@/pages-crm/operate-log/components/operate-log-list.vue'
import CrmPermissionTeam from '@/pages-crm/permission/components/permission-list.vue'
import CrmTransferForm from '@/pages-crm/permission/components/transfer-form.vue'
import { navigateBackPlus } from '@/utils'
import { formatDate, formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const bizType = BizTypeEnum.CRM_BUSINESS
// TODO @AI：这种顺序，应该和 vue3 + ep 一致，除了【基础信息】在前面以外；别的模块一起看下；
const tabs: { key: string, title: string }[] = [ // tab 配置
  { key: 'basic', title: '基本信息' },
  { key: 'followup', title: '跟进记录' },
  { key: 'contacts', title: '联系人' },
  { key: 'team', title: '团队成员' },
  { key: 'contracts', title: '合同' },
  { key: 'log', title: '操作日志' },
]
const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Record<string, any>>({}) // 详情数据
const tabIndex = ref(0) // 当前详情分类下标
const deleting = ref(false) // 删除状态
const moreActionVisible = ref(false) // 业务操作菜单显示状态
const teamCanQuit = ref(false) // 是否可退出团队
const followupRef = ref<{ openAdd: () => void }>() // 跟进记录引用
const teamRef = ref<{ openAdd: () => void, quit: () => void }>() // 团队成员引用
const listRef = ref<{ openAdd: () => void }>() // 当前关联列表引用
const transferFormRef = ref<InstanceType<typeof CrmTransferForm>>() // 转移表单引用
const businessStatusFormRef = ref<InstanceType<typeof CrmBusinessStatusForm>>() // 变更商机状态引用
const businessId = computed(() => Number(props.id))
const activeTab = computed(() => tabs[tabIndex.value].key)
const canUpdate = computed(() => hasAccessByCodes(['crm:business:update']))
const canDelete = computed(() => hasAccessByCodes(['crm:business:delete']))
const moreActions = computed(() => {
  const data = formData.value
  if (!data?.id) {
    return []
  }
  const actions = [
    { name: '转移', value: 'transfer' },
  ]
  if (!data.endStatus) {
    actions.push({ name: '变更商机状态', value: 'status' })
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
    case 'contacts':
      return hasAccessByCodes(['crm:contact:create'])
    case 'contracts':
      return hasAccessByCodes(['crm:contract:create'])
    default:
      return false
  }
})

/** 格式化金额 */
function formatMoney(value: any) {
  const amount = Number(value)
  return Number.isNaN(amount) ? '-' : amount.toFixed(2)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/business/index')
}

/** 加载详情 */
async function getDetail() {
  if (!businessId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getBusiness(businessId.value)
  } finally {
    toast.close()
  }
}

/** 业务操作菜单选择 */
function handleMoreAction({ item }: { item: { value: string } }) {
  const handlers: Record<string, () => void> = {
    transfer: handleTransfer,
    status: handleBusinessStatus,
  }
  handlers[item.value]?.()
}

/** 转移 */
function handleTransfer() {
  transferFormRef.value?.open(businessId.value)
}

/** 变更商机状态 */
function handleBusinessStatus() {
  businessStatusFormRef.value?.open(formData.value as any)
}

/** 退出团队后返回 */
function handleQuitTeam() {
  uni.$emit('crm:business:reload')
  setTimeout(() => handleBack(), 500)
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/business/form/index?id=${businessId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!businessId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该商机吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteBusiness(businessId.value)
    toast.success('删除成功')
    uni.$emit('crm:business:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:business:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:business:reload', getDetail)
})
</script>
