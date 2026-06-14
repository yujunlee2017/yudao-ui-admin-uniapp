<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="联系人详情"
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
    <CrmFollowupRecords v-else-if="activeTab === 'followup' && contactId" ref="followupRef" embedded :biz-id="contactId" :biz-type="bizType" />

    <!-- 关联商机 -->
    <ContactBusiness v-else-if="activeTab === 'businesses' && contactId" :contact-id="contactId" :customer-id="formData.customerId" />

    <!-- 团队成员 -->
    <CrmPermissionTeam v-else-if="activeTab === 'team' && contactId" ref="teamRef" embedded :biz-id="contactId" :biz-type="bizType" @quit-team="handleQuitTeam" @can-quit-change="(v: boolean) => teamCanQuit = v" />

    <!-- 操作日志 -->
    <CrmOperateLogs v-else-if="activeTab === 'log' && contactId" :biz-id="contactId" :biz-type="bizType" />

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
import { deleteContact, getContact } from '@/api/crm/contact'
import { BizTypeEnum } from '@/api/crm/permission'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ContactBusiness from '@/pages-crm/contact/components/contact-business.vue'
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

const bizType = BizTypeEnum.CRM_CONTACT
const tabs: { key: string, title: string }[] = [ // tab 配置
  { key: 'basic', title: '基本信息' },
  { key: 'followup', title: '跟进记录' },
  { key: 'businesses', title: '关联商机' },
  { key: 'team', title: '团队成员' },
  { key: 'log', title: '操作日志' },
]
const detailFields: { label: string, prop: string, dictType?: string, type?: 'bool' | 'datetime' }[] = [ // 基本信息字段
  { label: '联系人姓名', prop: 'name' },
  { label: '客户名称', prop: 'customerName' },
  { label: '负责人', prop: 'ownerUserName' },
  { label: '手机', prop: 'mobile' },
  { label: '电话', prop: 'telephone' },
  { label: '邮箱', prop: 'email' },
  { label: '微信', prop: 'wechat' },
  { label: 'QQ', prop: 'qq' },
  { label: '职位', prop: 'post' },
  { label: '关键决策人', prop: 'master', type: 'bool' },
  { label: '性别', prop: 'sex', dictType: DICT_TYPE.SYSTEM_USER_SEX },
  { label: '直属上级', prop: 'parentName' },
  { label: '地区', prop: 'areaName' },
  { label: '详细地址', prop: 'detailAddress' },
  { label: '下次联系时间', prop: 'contactNextTime', type: 'datetime' },
  { label: '最后跟进时间', prop: 'contactLastTime', type: 'datetime' },
  { label: '最后跟进内容', prop: 'contactLastContent' },
  { label: '备注', prop: 'remark' },
  { label: '创建时间', prop: 'createTime', type: 'datetime' },
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
const transferFormRef = ref<InstanceType<typeof CrmTransferForm>>() // 转移表单引用
const contactId = computed(() => Number(props.id))
const activeTabConfig = computed(() => tabs[tabIndex.value])
const activeTab = computed(() => activeTabConfig.value.key)
const canUpdate = computed(() => hasAccessByCodes(['crm:contact:update']))
const canDelete = computed(() => hasAccessByCodes(['crm:contact:delete']))
const moreActions = computed(() => {
  const data = formData.value
  if (!data?.id) {
    return []
  }
  return [
    { name: '转移', value: 'transfer' },
  ]
})
const hasFooter = computed(() => {
  switch (activeTab.value) {
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
  navigateBackPlus('/pages-crm/contact/index')
}

/** 加载详情 */
async function getDetail() {
  if (!contactId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getContact(contactId.value)
  } finally {
    toast.close()
  }
}

/** 业务操作菜单选择 */
function handleMoreAction({ item }: { item: { value: string } }) {
  const handlers: Record<string, () => void> = {
    transfer: handleTransfer,
  }
  handlers[item.value]?.()
}

/** 转移 */
function handleTransfer() {
  transferFormRef.value?.open(contactId.value)
}

/** 退出团队后返回 */
function handleQuitTeam() {
  uni.$emit('crm:contact:reload')
  setTimeout(() => handleBack(), 500)
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/contact/form/index?id=${contactId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!contactId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该联系人吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteContact(contactId.value)
    toast.success('删除成功')
    uni.$emit('crm:contact:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:contact:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:contact:reload', getDetail)
})
</script>
