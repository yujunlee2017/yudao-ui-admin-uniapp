<template>
  <view :class="embedded ? '' : 'mt-24rpx'">
    <!-- 跟进记录（独立模块内由底部操作触发新增时隐藏头部） -->
    <view v-if="!embedded" class="mb-16rpx flex items-center justify-between px-24rpx">
      <text class="text-30rpx text-[#333] font-semibold">跟进记录</text>
      <wd-button size="small" type="primary" @click="openAdd">
        写跟进
      </wd-button>
    </view>
    <view class="p-24rpx pb-160rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <view class="min-w-0 flex-1 text-28rpx text-[#333] font-semibold">
            {{ item.creatorName || item.creator || '-' }}
          </view>
          <dict-tag v-if="item.type !== undefined" :type="DICT_TYPE.CRM_FOLLOW_UP_TYPE" :value="item.type" />
        </view>
        <view class="mb-12rpx whitespace-pre-wrap text-28rpx text-[#666]">
          {{ item.content || '-' }}
        </view>
        <view class="mb-12rpx text-26rpx text-[#999]">
          创建时间：{{ formatDateTime(item.createTime) || '-' }}
        </view>
        <view v-if="item.nextTime" class="mb-12rpx text-26rpx text-[#999]">
          下次联系：{{ formatDateTime(item.nextTime) }}
        </view>
        <view v-if="item.picUrls?.length" class="mb-12rpx flex flex-wrap gap-12rpx">
          <image
            v-for="url in item.picUrls"
            :key="url"
            class="h-120rpx w-120rpx rounded-8rpx bg-[#f5f5f5]"
            mode="aspectFill"
            :src="url"
            @click="handlePreviewImage(item.picUrls!, url)"
          />
        </view>
        <view v-if="item.fileUrls?.length" class="mb-12rpx">
          <view
            v-for="url in item.fileUrls"
            :key="url"
            class="mb-8rpx flex items-center justify-between gap-16rpx rounded-8rpx bg-[#f7f8fa] px-16rpx py-12rpx text-26rpx"
            @click="handleOpenFile(url)"
          >
            <text class="min-w-0 flex-1 truncate text-[#333]">{{ getFileName(url) }}</text>
            <text class="shrink-0 text-primary">查看</text>
          </view>
        </view>
        <view v-if="item.contacts?.length" class="mb-12rpx text-26rpx text-[#999]">
          关联联系人：{{ item.contacts.map(contact => contact.name).join('、') }}
        </view>
        <view v-if="item.businesses?.length" class="mb-12rpx text-26rpx text-[#999]">
          关联商机：{{ item.businesses.map(business => business.name).join('、') }}
        </view>
        <view class="flex justify-end">
          <wd-button
            v-if="item.id"
            size="small"
            type="danger"
            variant="plain"
            :loading="deletingId === item.id"
            @click="handleDelete(item.id)"
          >
            删除
          </wd-button>
        </view>
      </view>
      <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无跟进记录" />
      <view v-if="loading" class="p-24rpx text-center text-28rpx text-[#999]">
        加载中...
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FollowUpRecord } from '@/api/crm/followup'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { deleteFollowUpRecord, getFollowUpRecordPage } from '@/api/crm/followup'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = withDefaults(defineProps<{
  bizId: number
  bizType: number
  embedded?: boolean // 嵌入模式：隐藏头部，由外层底部操作触发新增
}>(), {
  embedded: false,
})

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<FollowUpRecord[]>([]) // 跟进记录
const deletingId = ref<number>() // 删除状态

// TODO @AI：是不是需要 z-page 下？不然跟进记录，没有翻页呀；
/** 加载跟进记录 */
async function getList() {
  if (!props.bizId || !props.bizType) {
    return
  }
  loading.value = true
  try {
    const data = await getFollowUpRecordPage({
      pageNo: 1,
      pageSize: 20,
      bizId: props.bizId,
      bizType: props.bizType,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 写跟进（独立界面） */
function openAdd() {
  uni.navigateTo({ url: `/pages-crm/followup/form/index?bizId=${props.bizId}&bizType=${props.bizType}` })
}

/** 删除跟进记录 */
async function handleDelete(id: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该跟进记录吗？' })
  } catch {
    return
  }
  deletingId.value = id
  try {
    await deleteFollowUpRecord(id)
    toast.success('删除成功')
    await getList()
  } finally {
    deletingId.value = undefined
  }
}

/** 预览图片 */
function handlePreviewImage(urls: string[], current: string) {
  uni.previewImage({ urls, current })
}

/** 打开附件 */
function handleOpenFile(url: string) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank')
    return
  }
  uni.downloadFile({
    url,
    success: (res) => {
      uni.openDocument({ filePath: res.tempFilePath })
    },
  })
}

/** 获取文件名 */
function getFileName(url: string) {
  if (!url) {
    return ''
  }
  const path = url.split('?')[0]
  return decodeURIComponent(path.substring(path.lastIndexOf('/') + 1))
}

watch(
  () => [props.bizType, props.bizId],
  () => {
    getList()
  },
)

defineExpose({
  openAdd,
  getList,
})

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('crm:followup:reload', getList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('crm:followup:reload', getList)
})
</script>
