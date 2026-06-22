<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="评论详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <!-- TODO @AI：评论图片之类的； -->
    <wd-cell-group border>
      <wd-cell title="用户昵称" :value="formData.userNickname || '-'" />
      <wd-cell title="商品名称" :value="formData.spuName || '-'" />
      <wd-cell title="评分" :value="formData.scores != null ? String(formData.scores) : '-'" />
      <wd-cell title="是否显示">
        <wd-tag v-if="formData.visible != null" :type="formData.visible ? 'success' : 'info'" plain>
          {{ formData.visible ? '显示' : '隐藏' }}
        </wd-tag>
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="评论内容" :value="formData.content || '-'" />
      <wd-cell title="是否回复">
        <wd-tag v-if="formData.replyStatus != null" :type="formData.replyStatus ? 'primary' : 'info'" plain>
          {{ formData.replyStatus ? '已回复' : '未回复' }}
        </wd-tag>
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="回复内容" :value="formData.replyContent || '-'" />
      <wd-cell title="回复时间" :value="formatDateTime(formData.replyTime) || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <!-- TODO @AI：是不是显示“绿色”，不显示“橙色” -->
    <view v-if="canUpdate" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" @click="handleOpenReply">
          商家回复
        </wd-button>
        <wd-button class="flex-1" type="warning" :loading="toggling" @click="handleToggleVisible">
          {{ formData.visible ? '隐藏' : '显示' }}
        </wd-button>
      </view>
    </view>

    <!-- 商家回复弹窗 -->
    <wd-popup
      v-model="replyVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="handleCloseReply"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          商家回复
        </view>
        <wd-form ref="replyFormRef" :model="replyForm" :schema="replySchema">
          <wd-cell-group border>
            <wd-form-item title="回复内容" title-width="200rpx" prop="replyContent">
              <wd-textarea v-model="replyForm.replyContent" clearable :maxlength="500" placeholder="请输入回复内容" />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="handleCloseReply">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="replying" @click="handleSubmitReply">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProductComment } from '@/api/mall/product/comment'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { replyProductComment, updateProductCommentVisible } from '@/api/mall/product/comment'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

// 详情字段经列表页路由参数透传：后端 ProductCommentController 无 /get 接口（PC 的 /get 为死代码）
const props = defineProps<{
  id?: number | any
  userNickname?: string
  spuName?: string
  scores?: number | any
  visible?: boolean | string | any
  content?: string
  replyStatus?: boolean | string | any
  replyContent?: string
  replyTime?: string
  createTime?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<ProductComment>({}) // 详情数据
const toggling = ref(false) // 显示/隐藏切换状态
const replying = ref(false) // 回复提交状态
const replyVisible = ref(false) // 回复弹窗显示状态
const replyForm = ref({ replyContent: '' }) // 回复表单数据
const replyFormRef = ref<FormInstance>() // 回复表单引用
const replySchema = createFormSchema({
  replyContent: [{ required: true, message: '回复内容不能为空' }],
})
const canUpdate = computed(() => hasAccessByCodes(['product:comment:update']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/comment/index')
}

/** 路由参数解码：文本字段 */
function decodeText(value?: string) {
  return value ? decodeURIComponent(value) : ''
}

/** 路由参数解码：布尔字段（query 传来为字符串） */
function toBool(value: any) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  return value === true || value === 'true' || value === 1 || value === '1'
}

/** 加载详情（评论无 get 接口，字段经列表页路由参数透传） */
function loadDetail() {
  formData.value = {
    id: props.id != null ? Number(props.id) : undefined,
    userNickname: decodeText(props.userNickname),
    spuName: decodeText(props.spuName),
    scores: props.scores != null && props.scores !== '' ? Number(props.scores) : undefined,
    visible: toBool(props.visible),
    content: decodeText(props.content),
    replyStatus: toBool(props.replyStatus),
    replyContent: decodeText(props.replyContent),
    replyTime: decodeText(props.replyTime),
    createTime: decodeText(props.createTime),
  }
}

/** 打开回复弹窗 */
function handleOpenReply() {
  replyForm.value = { replyContent: formData.value.replyContent || '' }
  replyVisible.value = true
}

/** 关闭回复弹窗 */
function handleCloseReply() {
  replyVisible.value = false
}

/** 提交回复 */
async function handleSubmitReply() {
  if (!props.id) {
    return
  }
  const { valid } = await replyFormRef.value.validate()
  if (!valid) {
    return
  }
  replying.value = true
  try {
    await replyProductComment({ id: Number(props.id), replyContent: replyForm.value.replyContent })
    toast.success('回复成功')
    replyVisible.value = false
    // 本地回填回复结果（无 get 接口可刷新），并通知列表刷新
    formData.value.replyStatus = true
    formData.value.replyContent = replyForm.value.replyContent
    uni.$emit('mall:product-comment:reload')
  } finally {
    replying.value = false
  }
}

/** 显示/隐藏切换 */
async function handleToggleVisible() {
  if (!props.id) {
    return
  }
  const nextVisible = !formData.value.visible
  try {
    await dialog.confirm({ title: '提示', msg: nextVisible ? '确定要显示该评论吗？' : '确定要隐藏该评论吗？' })
  } catch {
    return
  }
  toggling.value = true
  try {
    await updateProductCommentVisible({ id: Number(props.id), visible: nextVisible })
    toast.success('操作成功')
    formData.value.visible = nextVisible
    uni.$emit('mall:product-comment:reload')
  } finally {
    toggling.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadDetail()
})
</script>
