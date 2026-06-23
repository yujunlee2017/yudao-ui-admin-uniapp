<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="砍价活动详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="活动名称" :value="formData.name || '-'" />
      <wd-cell title="活动状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="商品编号" :value="formData.spuId != null ? String(formData.spuId) : '-'" />
      <wd-cell title="SKU 编号" :value="formData.skuId != null ? String(formData.skuId) : '-'" />
      <wd-cell title="起始价" :value="formatDisplayMoney(formData.bargainFirstPrice)" />
      <wd-cell title="底价" :value="formatDisplayMoney(formData.bargainMinPrice)" />
      <wd-cell title="随机最小金额" :value="formatDisplayMoney(formData.randomMinPrice)" />
      <wd-cell title="随机最大金额" :value="formatDisplayMoney(formData.randomMaxPrice)" />
      <wd-cell title="库存" :value="formData.stock != null ? String(formData.stock) : '-'" />
      <wd-cell title="总限购" :value="formData.totalLimitCount != null ? String(formData.totalLimitCount) : '-'" />
      <wd-cell title="助力人数" :value="formData.helpMaxCount != null ? String(formData.helpMaxCount) : '-'" />
      <wd-cell title="帮砍次数" :value="formData.bargainCount != null ? String(formData.bargainCount) : '-'" />
      <wd-cell title="开始时间" :value="formatDateTime(formData.startTime) || '-'" />
      <wd-cell title="结束时间" :value="formatDateTime(formData.endTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['promotion:bargain-activity:update', 'promotion:bargain-activity:delete', 'promotion:bargain-activity:close'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['promotion:bargain-activity:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:bargain-activity:close'])" class="flex-1" type="info" :loading="closing" @click="handleClose">
          关闭活动
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:bargain-activity:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionBargainActivity } from '@/api/mall/promotion/bargain'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  closePromotionBargainActivity,
  deletePromotionBargainActivity,
  getPromotionBargainActivity,
} from '@/api/mall/promotion/bargain'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const formData = ref<PromotionBargainActivity>({}) // 详情数据
const deleting = ref(false) // 删除状态
const closing = ref(false) // 关闭状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/bargain/activity/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionBargainActivity(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/promotion/bargain/activity/form/index?id=${props.id}` })
}

/** 关闭活动 */
async function handleClose() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要关闭该活动吗？' })
  } catch {
    return
  }
  closing.value = true
  try {
    await closePromotionBargainActivity(Number(props.id))
    toast.success('关闭成功')
    uni.$emit('mall:promotion-bargain-activity:reload')
    await getDetail()
  } finally {
    closing.value = false
  }
}

/** 删除 */
async function handleDelete() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该砍价活动吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionBargainActivity(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mall:promotion-bargain-activity:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:promotion-bargain-activity:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-bargain-activity:reload', getDetail)
})
</script>
