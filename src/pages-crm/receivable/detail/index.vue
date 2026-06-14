<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="回款详情"
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
          <dict-tag v-if="hasValue(field.prop)" :type="field.dictType" :value="getValue(field.prop)" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell v-else :title="field.label" :value="formatValue(field)" />
      </template>
    </wd-cell-group>

    <!-- 团队成员 -->
    <CrmPermissionTeam v-else-if="activeTab === 'team' && receivableId" ref="teamRef" embedded :biz-id="receivableId" :biz-type="bizType" @quit-team="handleQuitTeam" @can-quit-change="(v: boolean) => teamCanQuit = v" />

    <!-- 操作日志 -->
    <CrmOperateLogs v-else-if="activeTab === 'log' && receivableId" :biz-id="receivableId" :biz-type="bizType" />

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
  </view>
</template>

<script lang="ts" setup>
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteReceivable, getReceivable, submitReceivable } from '@/api/crm/receivable'
import { BizTypeEnum } from '@/api/crm/permission'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import CrmOperateLogs from '@/pages-crm/operate-log/components/operate-log-list.vue'
import CrmPermissionTeam from '@/pages-crm/permission/components/permission-list.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const bizType = BizTypeEnum.CRM_RECEIVABLE
const tabs: { key: string, title: string }[] = [
  { key: 'basic', title: '基本信息' },
  { key: 'team', title: '团队成员' },
  { key: 'log', title: '操作日志' },
]
const detailFields: { label: string, prop: string, dictType?: string, type?: 'date' | 'datetime' | 'money' }[] = [ // 基本信息字段
  { label: '回款编号', prop: 'no' },
  { label: '客户名称', prop: 'customerName' },
  { label: '合同名称', prop: 'contract.name' },
  { label: '回款方式', prop: 'returnType', dictType: DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE },
  { label: '回款金额', prop: 'price', type: 'money' },
  { label: '回款日期', prop: 'returnTime', type: 'date' },
  { label: '负责人', prop: 'ownerUserName' },
  { label: '审批状态', prop: 'auditStatus', dictType: DICT_TYPE.CRM_AUDIT_STATUS },
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
const teamRef = ref<{ openAdd: () => void, quit: () => void }>() // 团队成员引用
const receivableId = computed(() => Number(props.id))
const activeTab = computed(() => tabs[tabIndex.value].key)
const canUpdate = computed(() => hasAccessByCodes(['crm:receivable:update']))
const canDelete = computed(() => hasAccessByCodes(['crm:receivable:delete']))
const moreActions = computed(() => {
  const data = formData.value
  if (!data?.id) {
    return []
  }
  const actions = [{ name: '提交审核', value: 'submit' }]
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
    case 'team':
      return true
    default:
      return false
  }
})

/** 获取对象路径值 */
function getValue(prop: string) {
  return prop.split('.').reduce((value: any, key) => value?.[key], formData.value)
}

/** 字段是否有值 */
function hasValue(prop: string) {
  const value = getValue(prop)
  return value !== undefined && value !== null && value !== ''
}

/** 格式化基本信息字段值 */
function formatValue(field: { prop: string, type?: 'date' | 'datetime' | 'money' }) {
  const value = getValue(field.prop)
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
    const amount = Number(value)
    return Number.isNaN(amount) ? String(value) : amount.toFixed(2)
  }
  return String(value)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/receivable/index')
}

/** 加载详情 */
async function getDetail() {
  if (!receivableId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getReceivable(receivableId.value)
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
    uni.$emit('crm:receivable:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 业务操作菜单选择 */
function handleMoreAction({ item }: { item: { value: string } }) {
  const handlers: Record<string, () => void> = {
    submit: handleSubmitAudit,
    viewProcess: handleViewProcess,
  }
  handlers[item.value]?.()
}

/** 提交审核 */
function handleSubmitAudit() {
  runAction(
    `确定提交回款【${formData.value.no || ''}】审核吗？`,
    () => submitReceivable(receivableId.value),
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
  uni.$emit('crm:receivable:reload')
  setTimeout(() => handleBack(), 500)
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/receivable/form/index?id=${receivableId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!receivableId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该回款吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteReceivable(receivableId.value)
    toast.success('删除成功')
    uni.$emit('crm:receivable:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:receivable:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:receivable:reload', getDetail)
})
</script>
