<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="售后详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view v-if="formData" class="p-24rpx">
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ formData.no || '-' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                申请时间：{{ formatDateTime(formData.createTime) || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_STATUS" :value="formData.status" />
          </view>
          <view class="grid grid-cols-2 gap-x-20rpx gap-y-12rpx text-26rpx">
            <view><text class="text-[#999]">订单号：</text>{{ formData.orderNo || '-' }}</view>
            <view><text class="text-[#999]">售后方式：</text>{{ getDictLabel(DICT_TYPE.TRADE_AFTER_SALE_WAY, formData.way) || '-' }}</view>
            <view><text class="text-[#999]">售后类型：</text>{{ getDictLabel(DICT_TYPE.TRADE_AFTER_SALE_TYPE, formData.type) || '-' }}</view>
            <view><text class="text-[#999]">退款金额：</text>{{ formatMallMoney(formData.refundPrice) }}</view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            售后商品
          </view>
          <view class="flex gap-20rpx rounded-8rpx bg-[#f8f8f8] p-16rpx">
            <image
              v-if="formData.picUrl"
              :src="formData.picUrl"
              class="h-128rpx w-128rpx shrink-0 rounded-8rpx bg-[#eee]"
              mode="aspectFill"
            />
            <view class="min-w-0 flex-1">
              <view class="line-clamp-2 text-28rpx text-[#333] font-semibold">
                {{ formData.spuName || '-' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#777]">
                数量：{{ formData.count || 0 }}
              </view>
              <view v-if="formData.properties?.length" class="mt-8rpx text-22rpx text-[#999]">
                {{ formData.properties.map(prop => `${prop.propertyName}:${prop.valueName}`).join('；') }}
              </view>
            </view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            申请信息
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view><text class="text-[#999]">申请原因：</text>{{ formData.applyReason || '-' }}</view>
            <view><text class="text-[#999]">补充描述：</text>{{ formData.applyDescription || '-' }}</view>
            <view v-if="formData.applyPicUrls?.length">
              <text class="text-[#999]">申请图片：</text>
              <view class="mt-12rpx flex flex-wrap gap-12rpx">
                <image
                  v-for="url in formData.applyPicUrls"
                  :key="url"
                  :src="url"
                  class="h-120rpx w-120rpx rounded-8rpx bg-[#eee]"
                  mode="aspectFill"
                />
              </view>
            </view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            处理信息
          </view>
          <view class="text-26rpx space-y-10rpx">
            <view><text class="text-[#999]">审核备注：</text>{{ formData.auditReason || '-' }}</view>
            <view><text class="text-[#999]">审核时间：</text>{{ formatDateTime(formData.auditTime) || '-' }}</view>
            <view><text class="text-[#999]">退货物流：</text>{{ formData.logisticsNo || '-' }}</view>
            <view><text class="text-[#999]">收货时间：</text>{{ formatDateTime(formData.receiveTime) || '-' }}</view>
            <view><text class="text-[#999]">退款时间：</text>{{ formatDateTime(formData.refundTime) || '-' }}</view>
          </view>
        </view>

        <!-- 售后日志 -->
        <view v-if="formData.logs?.length" class="mb-160rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            售后日志
          </view>
          <view class="yd-timeline">
            <view
              v-for="(log, index) in formData.logs"
              :key="log.id ?? index"
              class="yd-timeline-item"
            >
              <view class="yd-timeline-dot" :style="{ backgroundColor: getUserTypeColor(log.userType) }">
                {{ getUserTypeText(log.userType) }}
              </view>
              <view class="yd-timeline-content">
                <view class="text-26rpx text-[#333]">
                  {{ log.content || '-' }}
                </view>
                <view class="mt-6rpx text-22rpx text-[#999]">
                  {{ formatDateTime(log.createTime) || '-' }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <wd-empty v-else icon="content" tip="售后单不存在" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="formData && sheetActions.length" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" @click="actionSheetVisible = true">
          售后处理
        </wd-button>
      </view>
    </view>

    <!-- 操作菜单 -->
    <wd-action-sheet v-model="actionSheetVisible" :actions="sheetActions" @select="handleSelectAction" />

    <!-- 拒绝原因 -->
    <wd-popup
      v-model="rejectVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="rejectReason = ''"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          {{ rejectAction === 'refuse' ? '拒绝收货' : '拒绝售后' }}
        </view>
        <wd-textarea v-model="rejectReason" clearable :maxlength="500" :placeholder="rejectAction === 'refuse' ? '请输入拒绝收货原因' : '请输入拒绝原因'" />
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="rejectVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleReject">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { TradeAfterSale } from '@/api/mall/trade/after-sale'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  agreeTradeAfterSale,
  disagreeTradeAfterSale,
  getTradeAfterSale,
  receiveTradeAfterSale,
  refundTradeAfterSale,
  refuseTradeAfterSale,
} from '@/api/mall/trade/after-sale'
import { getDictLabel, getDictObj } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import { formatMallMoney } from '@/pages-mall/utils'
import { currRoute, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

type ActionKey = 'agree' | 'disagree' | 'receive' | 'refuse' | 'refund'

// 售后状态：10 申请中、20 卖家拒绝、30 待买家退货/卖家待收货、40 待退款、50 已完成
// TODO @AI：全局应该是有枚举的把。
const AFTER_SALE_STATUS = { APPLY: 10, WAIT_RECEIVE: 30, WAIT_REFUND: 40 }

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const detailId = ref<number>() // 售后编号
const formData = ref<TradeAfterSale>() // 售后详情
const actionSheetVisible = ref(false) // 操作菜单
const rejectVisible = ref(false) // 拒绝弹窗
const rejectReason = ref('') // 拒绝原因
const rejectAction = ref<'disagree' | 'refuse'>('disagree') // 拒绝弹窗对应动作：拒绝售后 / 拒绝收货
const submitting = ref(false) // 提交状态
// 按售后状态 + 权限网关：申请中可同意/拒绝，待收货可确认/拒绝收货，待退款可退款
const sheetActions = computed(() => {
  const status = formData.value?.status
  const items: { name: string, value: ActionKey, color?: string }[] = []
  if (status === AFTER_SALE_STATUS.APPLY) {
    // 同意/拒绝售后为后端独立权限码（trade:after-sale:agree / :disagree，无 :audit）
    if (hasAccessByCodes(['trade:after-sale:agree'])) {
      items.push({ name: '同意售后', value: 'agree' })
    }
    if (hasAccessByCodes(['trade:after-sale:disagree'])) {
      items.push({ name: '拒绝售后', value: 'disagree', color: '#fa4350' })
    }
  }
  if (status === AFTER_SALE_STATUS.WAIT_RECEIVE && hasAccessByCodes(['trade:after-sale:receive'])) {
    items.push({ name: '确认收货', value: 'receive' })
    items.push({ name: '拒绝收货', value: 'refuse', color: '#fa4350' })
  }
  if (status === AFTER_SALE_STATUS.WAIT_REFUND && hasAccessByCodes(['trade:after-sale:refund'])) {
    items.push({ name: '确认退款', value: 'refund' })
  }
  return items
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/after-sale/index')
}

/** 售后日志：按用户类型取节点颜色 */
function getUserTypeColor(userType?: number) {
  const dict = getDictObj(DICT_TYPE.USER_TYPE, userType ?? 0)
  switch (dict?.colorType) {
    case 'success':
      return '#67C23A'
    case 'info':
      return '#909399'
    case 'warning':
      return '#E6A23C'
    case 'danger':
      return '#F56C6C'
  }
  return '#409EFF'
}

/** 售后日志：节点文案（用户类型首字，缺省为「系」） */
function getUserTypeText(userType?: number) {
  return getDictLabel(DICT_TYPE.USER_TYPE, userType ?? 0)?.[0] || '系'
}

/** 加载详情 */
async function loadDetail() {
  if (!detailId.value) {
    return
  }
  formData.value = await getTradeAfterSale(detailId.value)
}

/** 选择动作 */
function handleSelectAction({ item }: { item: { value: ActionKey } }) {
  // 拒绝售后 / 拒绝收货均需填写原因
  if (item.value === 'disagree' || item.value === 'refuse') {
    rejectAction.value = item.value
    rejectVisible.value = true
    return
  }
  runAction(item.value)
}

/** 执行动作 */
// TODO @AI：不使用这种，参考别的模块
async function runAction(key: ActionKey) {
  if (!detailId.value) {
    return
  }
  // 仅 agree/receive/refund 走确认弹窗；disagree/refuse 经原因弹窗 handleReject 处理
  const confirmTextMap: Partial<Record<ActionKey, string>> = {
    agree: '确定同意该售后申请吗？',
    receive: '确定已收到退货商品吗？',
    refund: '确定执行退款吗？',
  }
  try {
    await dialog.confirm({ title: '提示', msg: confirmTextMap[key] || '确定执行该操作吗？' })
  } catch {
    return
  }
  submitting.value = true
  try {
    if (key === 'agree') {
      await agreeTradeAfterSale(detailId.value)
    } else if (key === 'receive') {
      await receiveTradeAfterSale(detailId.value)
    } else if (key === 'refund') {
      await refundTradeAfterSale(detailId.value)
    }
    toast.success('操作成功')
    uni.$emit('mall:trade-after-sale:reload')
    await loadDetail()
  } finally {
    submitting.value = false
  }
}

/** 拒绝售后 / 拒绝收货 */
async function handleReject() {
  if (!detailId.value) {
    return
  }
  if (!rejectReason.value.trim()) {
    toast.warning(rejectAction.value === 'refuse' ? '请输入拒绝收货原因' : '请输入拒绝原因')
    return
  }
  submitting.value = true
  try {
    if (rejectAction.value === 'refuse') {
      await refuseTradeAfterSale(detailId.value, rejectReason.value)
    } else {
      await disagreeTradeAfterSale({ id: detailId.value, auditReason: rejectReason.value })
    }
    toast.success('操作成功')
    rejectVisible.value = false
    rejectReason.value = ''
    uni.$emit('mall:trade-after-sale:reload')
    await loadDetail()
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  const query = currRoute().query
  // #ifdef H5
  const hashQuery = new URLSearchParams(window.location.hash.split('?')[1] || '')
  detailId.value = Number(hashQuery.get('id') || query.id || 0) || undefined
  // #endif
  // #ifndef H5
  detailId.value = Number(query.id || 0) || undefined
  // #endif
  await loadDetail()
})
// TODO @AI：参考 /Users/yunai/Java/yudao-ui-admin-uniapp-next-v4/src/pages-mall/trade/order 的一些建议；
// TODO @AI：能不能用 unocss 减少 style？
</script>

<style lang="scss" scoped>
.yd-timeline {
  position: relative;
  padding-left: 8rpx;
}

.yd-timeline-item {
  position: relative;
  display: flex;
  gap: 20rpx;
  padding-bottom: 28rpx;

  // 连接线：贯穿圆点中心，最后一项不画线
  &::before {
    content: '';
    position: absolute;
    top: 48rpx;
    left: 23rpx;
    bottom: 0;
    width: 2rpx;
    background-color: #ebebeb;
  }

  &:last-child {
    padding-bottom: 0;

    &::before {
      display: none;
    }
  }
}

.yd-timeline-dot {
  z-index: 1;
  display: flex;
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 24rpx;
}

.yd-timeline-content {
  min-width: 0;
  flex: 1;
  padding-top: 4rpx;
}
</style>
