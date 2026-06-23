<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="公众号素材"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 公众号选择 -->
    <AccountPicker v-model="accountId" @change="handleAccountChange" />

    <!-- 类型切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="图片" />
        <wd-tab title="语音" />
        <wd-tab title="视频" />
      </wd-tabs>
    </view>

    <!-- 上传操作 -->
    <view class="bg-white px-24rpx py-16rpx">
      <wd-button
        v-if="hasAccessByCodes(['mp:material:upload-permanent'])"
        type="primary"
        block
        :loading="uploading"
        @click="handleUpload"
      >
        {{ uploadButtonText }}
      </wd-button>
    </view>

    <!-- 素材列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无公众号素材数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <template v-if="currentType === 'image'">
            <wd-img
              v-if="item.url"
              :src="item.url"
              class="mb-16rpx"
              width="100%"
              height="360rpx"
              radius="8rpx"
              mode="aspectFit"
              enable-preview
            />
            <view class="text-30rpx text-[#333] font-semibold">
              {{ item.name || item.mediaId || '图片素材' }}
            </view>
          </template>
          <template v-else>
            <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
              {{ item.title || item.name || item.mediaId || materialTypeLabel }}
            </view>
            <view v-if="item.introduction" class="mb-12rpx text-26rpx text-[#666]">
              {{ item.introduction }}
            </view>
            <view class="mb-12rpx break-all text-24rpx text-[#999]">
              {{ item.url || '-' }}
            </view>
          </template>
          <view class="mb-20rpx text-24rpx text-[#999]">
            上传时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
          <view class="flex gap-16rpx">
            <wd-button
              v-if="item.url"
              class="flex-1" size="small" variant="plain" @click="handlePreview(item)"
            >
              查看
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['mp:material:delete'])"
              class="flex-1" size="small" type="danger" @click="handleDelete(item)"
            >
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 视频上传信息 -->
    <wd-popup v-model="videoFormVisible" position="bottom" safe-area-inset-bottom>
      <view class="bg-white p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          新建视频素材
        </view>
        <wd-input v-model="videoForm.title" placeholder="请输入标题" clearable />
        <view class="h-16rpx" />
        <wd-textarea v-model="videoForm.introduction" placeholder="请输入描述" clearable />
        <view class="mt-24rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="videoFormVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleChooseVideo">
            选择视频
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { Material } from '@/api/mp/material'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, reactive, ref } from 'vue'
import { deletePermanentMaterial, getMaterialPage, uploadPermanentMaterial } from '@/api/mp/material'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import AccountPicker from '../components/account-picker.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

type MaterialUploadType = 'image' | 'voice' | 'video'

const typeList: MaterialUploadType[] = ['image', 'voice', 'video']
const UPLOAD_LIMITS: Record<MaterialUploadType, {
  label: string
  maxSize: number
  types: string[]
  extensions: string[]
}> = {
  image: {
    label: '图片',
    maxSize: 2 * 1024 * 1024,
    types: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/jpg'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
  },
  voice: {
    label: '语音',
    maxSize: 2 * 1024 * 1024,
    types: ['audio/mp3', 'audio/mpeg', 'audio/wma', 'audio/wav', 'audio/amr'],
    extensions: ['mp3', 'wma', 'wav', 'amr'],
  },
  video: {
    label: '视频',
    maxSize: 10 * 1024 * 1024,
    types: ['video/mp4'],
    extensions: ['mp4'],
  },
}
const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const accountId = ref<number>() // 当前公众号编号
const tabIndex = ref(0) // 素材类型索引
const list = ref<Material[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const uploading = ref(false) // 上传状态
const videoFormVisible = ref(false) // 视频表单弹窗
const videoForm = reactive({
  title: '',
  introduction: '',
}) // 视频上传信息

const currentType = computed(() => typeList[tabIndex.value])
const materialTypeLabel = computed(() => currentType.value === 'voice' ? '语音素材' : '视频素材')
const uploadButtonText = computed(() => {
  if (currentType.value === 'image') {
    return '上传图片'
  }
  if (currentType.value === 'voice') {
    return '上传语音'
  }
  return '新建视频'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/index/index')
}

/** 公众号切换 */
function handleAccountChange(id: number) {
  accountId.value = id
  reload()
}

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  list.value = []
  reload()
}

/** 查询素材列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!accountId.value) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getMaterialPage({
      accountId: accountId.value,
      permanent: true,
      type: currentType.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 上传素材 */
function handleUpload() {
  if (!accountId.value) {
    toast.show('请先选择公众号')
    return
  }
  if (currentType.value === 'image') {
    chooseImage()
  } else if (currentType.value === 'video') {
    videoFormVisible.value = true
  } else {
    chooseVoice()
  }
}

/** 选择图片 */
function chooseImage() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const file = normalizeSelectedFile(res)
      if (file && validateUploadFile('image', file)) {
        uploadFile(file.path, { type: 'image' })
      }
    },
  })
}

/** 选择语音 */
function chooseVoice() {
  const chooseFile = (uni as any).chooseFile
  const chooseMessageFile = (uni as any).chooseMessageFile
  if (chooseFile) {
    chooseFile({
      count: 1,
      type: 'all',
      extension: UPLOAD_LIMITS.voice.extensions.map(item => `.${item}`),
      success: (res: any) => {
        const file = normalizeSelectedFile(res)
        if (file && validateUploadFile('voice', file)) {
          uploadFile(file.path, { type: 'voice' })
        }
      },
    })
    return
  }
  if (chooseMessageFile) {
    chooseMessageFile({
      count: 1,
      type: 'file',
      extension: UPLOAD_LIMITS.voice.extensions,
      success: (res: any) => {
        const file = normalizeSelectedFile(res)
        if (file && validateUploadFile('voice', file)) {
          uploadFile(file.path, { type: 'voice' })
        }
      },
    })
    return
  }
  toast.show('当前端不支持选择语音文件')
}

/** 选择视频 */
function handleChooseVideo() {
  if (!videoForm.title || !videoForm.introduction) {
    toast.show('请输入标题和描述')
    return
  }
  uni.chooseVideo({
    extension: UPLOAD_LIMITS.video.extensions.map(item => `.${item}`),
    success: (res) => {
      const file = normalizeSelectedFile(res)
      if (!file || !validateUploadFile('video', file)) {
        return
      }
      videoFormVisible.value = false
      uploadFile(file.path, {
        type: 'video',
        title: videoForm.title,
        introduction: videoForm.introduction,
      })
    },
  })
}

/** 规范选择文件结果 */
function normalizeSelectedFile(res: any) {
  const tempFiles = Array.isArray(res.tempFiles) ? res.tempFiles : [res.tempFiles]
  const tempFilePaths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths]
  const file = tempFiles.find(Boolean) || {}
  const path = res.tempFilePath || file.tempFilePath || file.path || tempFilePaths.find(Boolean)
  if (!path) {
    toast.show('未获取到文件路径')
    return undefined
  }
  return {
    path,
    name: file.name || path,
    size: file.size || res.size || 0,
    type: file.type || res.type || '',
  }
}

/** 校验上传文件 */
function validateUploadFile(type: MaterialUploadType, file: { name?: string, size?: number, type?: string }) {
  const limit = UPLOAD_LIMITS[type]
  const mimeType = file.type?.toLowerCase()
  const extension = file.name?.split('.').pop()?.toLowerCase()
  const isValidType = (!!mimeType && limit.types.includes(mimeType))
    || (!!extension && limit.extensions.includes(extension))
  if (!isValidType) {
    toast.show(`上传${limit.label}格式不对`)
    return false
  }
  if (file.size && file.size > limit.maxSize) {
    toast.show(`上传${limit.label}大小不能超过${limit.maxSize / 1024 / 1024}M`)
    return false
  }
  return true
}

/** 上传文件 */
async function uploadFile(filePath: string, data: { type: string, title?: string, introduction?: string }) {
  if (!accountId.value) {
    return
  }
  uploading.value = true
  try {
    await uploadPermanentMaterial(filePath, {
      accountId: accountId.value,
      ...data,
    })
    toast.success('上传成功')
    reload()
  } finally {
    uploading.value = false
  }
}

/** 查看素材 */
function handlePreview(item: Material) {
  if (!item.url) {
    return
  }
  // #ifdef H5
  window.open(item.url, '_blank')
  // #endif
  // #ifndef H5
  uni.setClipboardData({ data: item.url })
  // #endif
}

/** 删除素材 */
async function handleDelete(item: Material) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '此操作将永久删除该素材，是否继续？',
    })
  } catch {
    return
  }
  await deletePermanentMaterial(item.id)
  toast.success('删除成功')
  reload()
}
</script>

<style lang="scss" scoped>
</style>
