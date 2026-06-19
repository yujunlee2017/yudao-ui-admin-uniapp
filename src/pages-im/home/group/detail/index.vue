<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="群详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 群资料 -->
    <view class="p-24rpx">
      <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="flex items-center gap-20rpx">
          <ImAvatar :src="formData?.avatar" :name="formData?.name" :round="false" size="100rpx" />
          <view class="min-w-0 flex-1">
            <view class="truncate text-36rpx text-[#333] font-semibold">{{ formData?.name || '-' }}</view>
            <view class="mt-8rpx text-24rpx text-[#999]">群号：{{ formData?.id }}</view>
          </view>
          <wd-tag v-if="formData?.banned" type="danger" plain>已封禁</wd-tag>
          <wd-tag v-else-if="formData?.mutedAll" type="warning" plain>全员禁言</wd-tag>
        </view>
        <view class="mt-24rpx rounded-8rpx bg-[#f7f8fa] p-20rpx text-26rpx text-[#666]">
          {{ formData?.notice || '暂无群公告' }}
        </view>
        <view class="mt-24rpx grid grid-cols-2 gap-16rpx">
          <wd-button type="primary" block @click="handleChat">发消息</wd-button>
          <wd-button block variant="plain" @click="moreActionVisible = true">更多</wd-button>
        </view>
      </view>

      <!-- 群设置 -->
      <view class="mt-24rpx rounded-12rpx bg-white shadow-sm">
        <wd-cell-group border>
          <wd-cell title="群主编号" :value="formData?.ownerUserId" />
          <wd-cell title="进群审批" :value="formData?.joinApproval ? '开启' : '关闭'" />
          <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime)" />
        </wd-cell-group>
      </view>

      <!-- 群成员 -->
      <view class="mt-24rpx rounded-12rpx bg-white shadow-sm">
        <view class="flex items-center justify-between px-24rpx py-20rpx">
          <text class="text-30rpx text-[#333] font-semibold">群成员</text>
          <view class="flex items-center gap-16rpx">
            <text class="text-24rpx text-[#999]">{{ members.length }} 人</text>
            <wd-button
              v-if="canManageGroup"
              size="small"
              type="primary"
              variant="plain"
              @click="inviteVisible = true"
            >
              邀请
            </wd-button>
          </view>
        </view>
        <view
          v-for="item in members"
          :key="item.userId"
          class="flex items-center gap-20rpx border-t border-t-[#f2f3f5] px-24rpx py-20rpx"
        >
          <ImAvatar :src="item.avatar" :name="getMemberName(item)" />
          <view class="min-w-0 flex-1">
            <view class="truncate text-30rpx text-[#333] font-medium">{{ getMemberName(item) }}</view>
            <view class="mt-4rpx flex items-center gap-8rpx text-24rpx text-[#999]">
              <dict-tag :type="DICT_TYPE.IM_GROUP_MEMBER_ROLE" :value="item.role" />
              <text v-if="item.muteEndTime">禁言至 {{ formatDateTime(item.muteEndTime) }}</text>
            </view>
          </view>
          <wd-button
            v-if="canManageMember(item)"
            size="small"
            variant="plain"
            @click="handleMemberMore(item)"
          >
            管理
          </wd-button>
        </view>
        <wd-empty v-if="!loading && members.length === 0" icon="content" tip="暂无成员" />
      </view>
    </view>

    <!-- 更多操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />

    <!-- 邀请成员 -->
    <wd-popup v-model="inviteVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-24rpx pb-[calc(24rpx+env(safe-area-inset-bottom))]">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">邀请成员</view>
        <wd-cell-group border>
          <UserPicker
            v-model="inviteUserIds"
            label="成员"
            type="checkbox"
            placeholder="请选择用户"
          />
        </wd-cell-group>
        <view class="mt-24rpx grid grid-cols-2 gap-16rpx">
          <wd-button block variant="plain" @click="inviteVisible = false">取消</wd-button>
          <wd-button block type="primary" :loading="inviting" @click="handleInviteMembers">邀请</wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ImGroupRespVO } from '@/api/im/group'
import type { ImGroupMemberRespVO } from '@/api/im/group/member'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  addGroupAdmin,
  cancelMuteMember,
  dissolveGroup,
  getGroup,
  muteAll,
  muteMember,
  removeGroupAdmin,
  transferGroupOwner,
} from '@/api/im/group'
import {
  getGroupMemberList,
  inviteGroupMember,
  quitGroup,
  removeGroupMember,
} from '@/api/im/group/member'
import { UserPicker } from '@/components/system-select'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, ImConversationType, ImGroupMemberRole } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ImAvatar from '../../components/im-avatar.vue'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 详情加载状态
const formData = ref<ImGroupRespVO>() // 群详情
const members = ref<ImGroupMemberRespVO[]>([]) // 群成员
const moreActionVisible = ref(false) // 更多操作菜单
const inviteVisible = ref(false) // 邀请成员弹窗
const inviting = ref(false) // 邀请提交状态
const inviteUserIds = ref<number[]>([]) // 邀请用户编号

/** 当前用户群成员 */
const currentMember = computed(() => {
  const currentUserId = userStore.userInfo.userId
  return members.value.find(item => item.userId === currentUserId)
})

/** 是否可管理群 */
const canManageGroup = computed(() => {
  return currentMember.value?.role === ImGroupMemberRole.OWNER || currentMember.value?.role === ImGroupMemberRole.ADMIN
})

/** 是否群主 */
const isOwner = computed(() => currentMember.value?.role === ImGroupMemberRole.OWNER)

/** 更多操作 */
const moreActions = computed(() => {
  const actions: Array<{ name: string, value: string }> = [
    { name: '复制群号', value: 'copy' },
    { name: '退出群聊', value: 'quit' },
  ]
  if (canManageGroup.value) {
    actions.unshift({ name: '编辑群资料', value: 'edit' })
    actions.unshift({ name: formData.value?.mutedAll ? '取消全员禁言' : '全员禁言', value: 'muteAll' })
  }
  if (currentMember.value?.role === ImGroupMemberRole.OWNER) {
    actions.push({ name: '解散群聊', value: 'dissolve' })
  }
  return actions
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/friend/index?tab=group')
}

/** 获取成员显示名 */
function getMemberName(item: ImGroupMemberRespVO) {
  return item.displayUserName || item.nickname || `用户 ${item.userId}`
}

/** 是否可管理成员 */
function canManageMember(item: ImGroupMemberRespVO) {
  const currentUserId = userStore.userInfo.userId
  if (!canManageGroup.value || item.userId === currentUserId || item.role === ImGroupMemberRole.OWNER) {
    return false
  }
  return isOwner.value || item.role === ImGroupMemberRole.NORMAL
}

/** 发消息 */
function handleChat() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-im/home/chat/index?type=${ImConversationType.GROUP}&targetId=${formData.value.id}&title=${encodeURIComponent(formData.value.name)}`,
  })
}

/** 更多操作 */
async function handleMoreAction({ item }: { item: { value: string } }) {
  if (item.value === 'copy') {
    uni.setClipboardData({ data: String(formData.value?.id || '') })
  } else if (item.value === 'edit') {
    if (formData.value?.id) {
      uni.navigateTo({ url: `/pages-im/home/group/form/index?id=${formData.value.id}` })
    }
  } else if (item.value === 'muteAll') {
    await handleMuteAll()
  } else if (item.value === 'quit') {
    await handleQuit()
  } else if (item.value === 'dissolve') {
    await handleDissolve()
  }
}

/** 邀请成员 */
async function handleInviteMembers() {
  if (!formData.value?.id || inviteUserIds.value.length === 0) {
    toast.show('请选择邀请成员')
    return
  }
  inviting.value = true
  try {
    await inviteGroupMember({
      groupId: formData.value.id,
      memberUserIds: inviteUserIds.value,
    })
    toast.success('邀请成功')
    inviteUserIds.value = []
    inviteVisible.value = false
    await getDetail()
  } finally {
    inviting.value = false
  }
}

/** 成员管理操作 */
function handleMemberMore(item: ImGroupMemberRespVO) {
  if (!formData.value?.id) {
    return
  }
  const actions: Array<{ name: string, value: string, mutedSeconds?: number }> = []
  if (isOwner.value) {
    if (item.role === ImGroupMemberRole.ADMIN) {
      actions.push({ name: '撤销管理员', value: 'removeAdmin' })
    } else {
      actions.push({ name: '设为管理员', value: 'addAdmin' })
    }
    actions.push({ name: '转让群主', value: 'transferOwner' })
  }
  if (item.muteEndTime) {
    actions.push({ name: '取消禁言', value: 'cancelMute' })
  } else {
    actions.push({ name: '禁言 10 分钟', value: 'mute', mutedSeconds: 600 })
    actions.push({ name: '禁言 1 小时', value: 'mute', mutedSeconds: 3600 })
  }
  actions.push({ name: '移出群聊', value: 'remove' })
  uni.showActionSheet({
    itemList: actions.map(action => action.name),
    success: ({ tapIndex }) => {
      const action = actions[tapIndex]
      handleMemberAction(item, action)
    },
  })
}

/** 执行成员管理 */
async function handleMemberAction(
  member: ImGroupMemberRespVO,
  action: { value: string, mutedSeconds?: number },
) {
  if (!formData.value?.id) {
    return
  }
  const groupId = formData.value.id
  if (action.value === 'addAdmin') {
    await addGroupAdmin({ id: groupId, userIds: [member.userId] })
    toast.success('已设为管理员')
  } else if (action.value === 'removeAdmin') {
    await removeGroupAdmin({ id: groupId, userIds: [member.userId] })
    toast.success('已撤销管理员')
  } else if (action.value === 'transferOwner') {
    try {
      await dialog.confirm({ title: '提示', msg: `确定将群主转让给“${getMemberName(member)}”吗？` })
    } catch {
      return
    }
    await transferGroupOwner({ id: groupId, newOwnerUserId: member.userId })
    toast.success('已转让群主')
  } else if (action.value === 'mute') {
    await muteMember({ id: groupId, userId: member.userId, mutedSeconds: action.mutedSeconds || 600 })
    toast.success('已禁言')
  } else if (action.value === 'cancelMute') {
    await cancelMuteMember({ id: groupId, userId: member.userId })
    toast.success('已取消禁言')
  } else if (action.value === 'remove') {
    try {
      await dialog.confirm({ title: '提示', msg: `确定将“${getMemberName(member)}”移出群聊吗？` })
    } catch {
      return
    }
    await removeGroupMember({ groupId, memberUserIds: [member.userId] })
    toast.success('已移出群聊')
  }
  await getDetail()
}

/** 全员禁言切换 */
async function handleMuteAll() {
  if (!formData.value?.id) {
    return
  }
  await muteAll({ id: formData.value.id, mutedAll: !formData.value.mutedAll })
  toast.success('更新成功')
  await getDetail()
}

/** 退出群聊 */
async function handleQuit() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定退出“${formData.value.name}”吗？` })
  } catch {
    return
  }
  await quitGroup(formData.value.id)
  toast.success('已退出群聊')
  setTimeout(handleBack, 500)
}

/** 解散群聊 */
async function handleDissolve() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定解散“${formData.value.name}”吗？` })
  } catch {
    return
  }
  await dissolveGroup(formData.value.id)
  toast.success('已解散群聊')
  setTimeout(handleBack, 500)
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  loading.value = true
  try {
    const [group, memberList] = await Promise.all([
      getGroup(props.id),
      getGroupMemberList(props.id),
    ])
    formData.value = group
    members.value = memberList
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
