<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="核销订单"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 核销码核销入口 -->
    <view v-if="hasAccessByCodes(['trade:order:pick-up'])" class="px-24rpx pt-24rpx">
      <wd-button block type="success" @click="openVerifyPopup">
        核销码核销
      </wd-button>
    </view>

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无核销订单数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ item.no || '-' }}
            </view>
            <dict-tag v-if="item.status != null" :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="item.status" />
          </view>

          <view class="flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">实付金额：</text>
            <text class="text-[#fa8c16] font-semibold">{{ formatMallMoney(item.payPrice) }}</text>
          </view>
          <view class="mt-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">核销码：</text>
            <text class="truncate">{{ item.pickUpVerifyCode || '-' }}</text>
          </view>
          <view class="mt-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 核销码核销弹窗 -->
    <wd-popup
      v-model="verifyVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="closeVerifyPopup"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          核销码核销
        </view>
        <wd-input v-model="verifyCode" clearable placeholder="请输入核销码" />
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="closeVerifyPopup">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="verifySubmitting" @click="handleVerify">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { TradeOrder } from '@/api/mall/trade/order'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getDeliveryPickUpOrderPage } from '@/api/mall/trade/delivery/pick-up-order'
import { pickUpTradeOrderByVerifyCode } from '@/api/mall/trade/order'
import { formatMallMoney } from '@/pages-mall/utils'
import { navigateBackPlus } from '@/utils'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()

const list = ref<TradeOrder[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const verifyVisible = ref(false) // 核销码弹窗显示状态
const verifyCode = ref('') // 核销码
const verifySubmitting = ref(false) // 核销提交状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询核销订单列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getDeliveryPickUpOrderPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看详情：透传行数据标量字段，避免详情页二次拉取 */
function handleDetail(item: TradeOrder) {
  const query = [
    item.id != null ? `id=${item.id}` : '',
    item.no ? `no=${encodeURIComponent(item.no)}` : '',
    item.status != null ? `status=${item.status}` : '',
    item.payPrice != null ? `payPrice=${item.payPrice}` : '',
    item.pickUpVerifyCode ? `pickUpVerifyCode=${encodeURIComponent(item.pickUpVerifyCode)}` : '',
    item.pickUpStoreId != null ? `pickUpStoreId=${item.pickUpStoreId}` : '',
    item.createTime ? `createTime=${encodeURIComponent(item.createTime)}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-mall/trade/delivery/pick-up-order/detail/index${query ? `?${query}` : ''}` })
}

/** 打开核销码弹窗 */
function openVerifyPopup() {
  verifyCode.value = ''
  verifyVisible.value = true
}

/** 关闭核销码弹窗 */
function closeVerifyPopup() {
  verifyVisible.value = false
  verifyCode.value = ''
}

/** 核销码核销 */
async function handleVerify() {
  if (!verifyCode.value) {
    toast.error('请输入核销码')
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要核销该核销码对应的订单吗？' })
  } catch {
    return
  }
  verifySubmitting.value = true
  try {
    await pickUpTradeOrderByVerifyCode(verifyCode.value)
    toast.success('核销成功')
    closeVerifyPopup()
    uni.$emit('mall:delivery-pick-up-order:reload')
    pagingRef.value?.reload()
  } finally {
    verifySubmitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mall:delivery-pick-up-order:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:delivery-pick-up-order:reload', reload)
})
</script>
