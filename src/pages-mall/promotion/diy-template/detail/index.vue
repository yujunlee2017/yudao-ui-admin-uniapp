<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="装修模板详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="编号" :value="formData.id != null ? String(formData.id) : '-'" />
      <wd-cell title="模板名称" :value="formData.name || '-'" />
      <wd-cell title="是否使用" :value="formData.used != null ? (formData.used ? '是' : '否') : '-'" />
      <wd-cell title="使用时间" :value="formatDateTime(formData.usedTime) || '-'" />
      <wd-cell title="备注" :value="formData.remark || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 预览图 -->
    <view class="mt-24rpx bg-white p-24rpx">
      <view class="mb-16rpx text-28rpx text-[#999]">
        预览图
      </view>
      <view v-if="formData.previewPicUrls?.length" class="flex flex-wrap gap-12rpx">
        <image
          v-for="url in formData.previewPicUrls"
          :key="url"
          :src="url"
          class="h-120rpx w-120rpx rounded-8rpx bg-[#eee]"
          mode="aspectFill"
        />
      </view>
      <text v-else class="text-28rpx text-[#999]">-</text>
    </view>

    <!-- 装修属性 -->
    <view class="mt-24rpx bg-white p-24rpx">
      <view class="mb-16rpx text-28rpx text-[#999]">
        装修属性
      </view>
      <view class="whitespace-pre-wrap break-all rounded-8rpx bg-[#f7f7f7] p-16rpx text-24rpx text-[#666]">
        {{ propertyText }}
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="canUse || canUpdate || canDelete" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canUse" class="flex-1" type="primary" :loading="using" @click="handleUse">
          使用模板
        </wd-button>
        <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionDiyTemplate } from '@/api/mall/promotion/diy/template'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deletePromotionDiyTemplate,
  getPromotionDiyTemplate,
  usePromotionDiyTemplate,
} from '@/api/mall/promotion/diy/template'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<PromotionDiyTemplate>({} as PromotionDiyTemplate) // 详情数据
const deleting = ref(false) // 删除状态
const using = ref(false) // 使用模板状态
const canUpdate = computed(() => hasAccessByCodes(['promotion:diy-template:update']))
const canDelete = computed(() => hasAccessByCodes(['promotion:diy-template:delete']))
const canUse = computed(() => !formData.value.used && hasAccessByCodes(['promotion:diy-template:update']))
const propertyText = computed(() => formatProperty(formData.value.property)) // 装修属性文本

/** 格式化装修属性 */
function formatProperty(value: any) {
  if (value == null || value === '') {
    return '-'
  }
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/diy-template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionDiyTemplate(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/promotion/diy-template/form/index?id=${props.id}` })
}

/** 使用模板 */
async function handleUse() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要使用该装修模板吗？' })
  } catch {
    return
  }
  using.value = true
  try {
    await usePromotionDiyTemplate(Number(props.id))
    toast.success('使用成功')
    uni.$emit('mall:promotion-diy-template:reload')
    await getDetail()
  } finally {
    using.value = false
  }
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该装修模板吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionDiyTemplate(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mall:promotion-diy-template:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:promotion-diy-template:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-diy-template:reload', getDetail)
})
</script>
