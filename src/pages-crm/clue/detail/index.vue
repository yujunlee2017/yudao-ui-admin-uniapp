<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="线索详情"
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
    <wd-cell-group v-if="activeTab === 'basic'" border>
      <template v-for="field in detailFields" :key="field.prop">
        <wd-cell v-if="field.dictType" :title="field.label">
          <dict-tag v-if="hasValue(field.prop)" :type="field.dictType" :value="formData[field.prop]" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell v-else :title="field.label" :value="formatValue(field)" />
      </template>
    </wd-cell-group>

    <!-- 跟进记录 -->
    <CrmFollowupRecords v-else-if="activeTab === 'followup' && clueId" ref="followupRef" embedded :biz-id="clueId" :biz-type="bizType" />

    <!-- 团队成员 -->
    <CrmPermissionTeam v-else-if="activeTab === 'team' && clueId" ref="teamRef" embedded :biz-id="clueId" :biz-type="bizType" @quit-team="handleQuitTeam" @can-quit-change="(v: boolean) => teamCanQuit = v" />

    <!-- 操作日志 -->
    <CrmOperateLogs v-else-if="activeTab === 'log' && clueId" :biz-id="clueId" :biz-type="bizType" />

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
import { deleteClue, getClue, transformClue } from '@/api/crm/clue'
import { BizTypeEnum } from '@/api/crm/permission'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import CrmFollowupRecords from '@/pages-crm/followup/components/followup-list.vue'
import CrmOperateLogs from '@/pages-crm/operate-log/components/operate-log-list.vue'
import CrmPermissionTeam from '@/pages-crm/permission/components/permission-list.vue'
import CrmTransferForm from '@/pages-crm/permission/components/transfer-form.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const bizType = BizTypeEnum.CRM_CLUE
const tabs: { key: string, title: string }[] = [
  { key: 'basic', title: '基本信息' },
  { key: 'followup', title: '跟进记录' },
  { key: 'team', title: '团队成员' },
  { key: 'log', title: '操作日志' },
]
const detailFields: { label: string, prop: string, dictType?: string, type?: 'bool' | 'datetime' }[] = [ // 基本信息字段
  { label: '线索名称', prop: 'name' },
  { label: '客户来源', prop: 'source', dictType: DICT_TYPE.CRM_CUSTOMER_SOURCE },
  { label: '手机', prop: 'mobile' },
  { label: '负责人', prop: 'ownerUserName' },
  { label: '电话', prop: 'telephone' },
  { label: '邮箱', prop: 'email' },
  { label: '微信', prop: 'wechat' },
  { label: 'QQ', prop: 'qq' },
  { label: '客户行业', prop: 'industryId', dictType: DICT_TYPE.CRM_CUSTOMER_INDUSTRY },
  { label: '客户级别', prop: 'level', dictType: DICT_TYPE.CRM_CUSTOMER_LEVEL },
  { label: '地区', prop: 'areaName' },
  { label: '详细地址', prop: 'detailAddress' },
  { label: '下次联系时间', prop: 'contactNextTime', type: 'datetime' },
  { label: '最后跟进时间', prop: 'contactLastTime', type: 'datetime' },
  { label: '最后跟进内容', prop: 'contactLastContent' },
  { label: '备注', prop: 'remark' },
  { label: '创建时间', prop: 'createTime', type: 'datetime' },
  { label: '转化状态', prop: 'transformStatus', type: 'bool' },
  { label: '转化客户', prop: 'customerName' },
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
const transferFormRef = ref<InstanceType<typeof CrmTransferForm>>() // 转移表单引用
const clueId = computed(() => Number(props.id))
const activeTab = computed(() => tabs[tabIndex.value].key)
const canUpdate = computed(() => hasAccessByCodes(['crm:clue:update']))
const canDelete = computed(() => hasAccessByCodes(['crm:clue:delete']))
const moreActions = computed(() => {
  const data = formData.value
  if (!data?.id) {
    return []
  }
  const actions = [
    { name: '转移', value: 'transfer' },
  ]
  // 已转化的线索不再展示「转化为客户」
  if (!data.transformStatus) {
    actions.push({ name: '转化为客户', value: 'transform' })
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
function formatValue(field: { prop: string, type?: 'bool' | 'datetime' }) {
  const value = formData.value[field.prop]
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (field.type === 'datetime') {
    return formatDateTime(value) || '-'
  }
  if (field.type === 'bool') {
    return value ? '是' : '否'
  }
  return String(value)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/clue/index')
}

/** 加载详情 */
async function getDetail() {
  if (!clueId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getClue(clueId.value)
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
    uni.$emit('crm:clue:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 业务操作菜单选择 */
function handleMoreAction({ item }: { item: { value: string } }) {
  const handlers: Record<string, () => void> = {
    transfer: handleTransfer,
    transform: handleTransform,
  }
  handlers[item.value]?.()
}

/** 转移 */
function handleTransfer() {
  transferFormRef.value?.open(clueId.value)
}

/** 转化为客户 */
function handleTransform() {
  runAction(
    `确定将线索【${formData.value.name || ''}】转化为客户吗？`,
    () => transformClue(clueId.value),
    '转化成功',
  )
}

/** 退出团队后返回 */
function handleQuitTeam() {
  uni.$emit('crm:clue:reload')
  setTimeout(() => handleBack(), 500)
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/clue/form/index?id=${clueId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!clueId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该线索吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteClue(clueId.value)
    toast.success('删除成功')
    uni.$emit('crm:clue:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:clue:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:clue:reload', getDetail)
})
</script>
