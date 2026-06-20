<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="运费模板详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="模板名称" :value="formData.name || '-'" />
      <wd-cell title="计费方式" :value="formData.chargeMode != null ? String(formData.chargeMode) : '-'" />
      <wd-cell title="排序" :value="formData.sort != null ? String(formData.sort) : '-'" />
      <!-- 移动端简化：区域计费以 JSON 文本展示，不复刻 PC 区域编辑器 -->
      <wd-cell title="计费区域">
        <text class="break-all text-26rpx text-[#666] whitespace-pre-wrap">{{ stringifyJson(formData.templateCharge) }}</text>
      </wd-cell>
      <wd-cell title="包邮区域">
        <text class="break-all text-26rpx text-[#666] whitespace-pre-wrap">{{ stringifyJson(formData.templateFree) }}</text>
      </wd-cell>
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="canUpdate || canDelete" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
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
import type { DeliveryExpressTemplate } from '@/api/mall/trade/delivery/express-template'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteDeliveryExpressTemplate, getDeliveryExpressTemplate } from '@/api/mall/trade/delivery/express-template'
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
const formData = ref<DeliveryExpressTemplate>({} as DeliveryExpressTemplate) // 详情数据
const deleting = ref(false) // 删除状态
const canUpdate = computed(() => hasAccessByCodes(['trade:delivery:express-template:update']))
const canDelete = computed(() => hasAccessByCodes(['trade:delivery:express-template:delete']))

/** 区域计费数组转 JSON 文本（2 空格缩进），空值显示 '-' */
function stringifyJson(value: unknown) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return '-'
  }
  return JSON.stringify(value, null, 2)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/delivery/express-template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getDeliveryExpressTemplate(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/trade/delivery/express-template/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该运费模板吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDeliveryExpressTemplate(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mall:delivery-express-template:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:delivery-express-template:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:delivery-express-template:reload', getDetail)
})
</script>
