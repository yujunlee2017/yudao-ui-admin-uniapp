<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="优惠券"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 列表操作 -->
    <view v-if="canSend" class="bg-white px-24rpx py-16rpx">
      <wd-button size="small" type="primary" @click="sendVisible = true">
        发送优惠券
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
      empty-view-text="暂无优惠券"
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
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name || `优惠券 #${item.id}` }}
            </view>
            <dict-tag v-if="item.status != null" :type="DICT_TYPE.PROMOTION_COUPON_STATUS" :value="item.status" />
          </view>

          <view class="mb-12rpx flex items-center justify-between text-26rpx text-[#666]">
            <text>门槛：{{ formatMallMoney(item.usePrice) }}</text>
            <text>优惠：{{ formatMallMoney(item.discountPrice) }}</text>
          </view>
          <view class="flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">用户编号：</text>
            <text>{{ item.userId ?? '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 发送优惠券弹窗 -->
    <wd-popup
      v-model="sendVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="sendVisible = false"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          发送优惠券
        </view>
        <wd-cell-group border>
          <wd-form-item title="模板编号" title-width="200rpx">
            <wd-input v-model="sendForm.templateId" type="number" clearable placeholder="请输入优惠券模板编号" />
          </wd-form-item>
          <wd-form-item title="用户编号" title-width="200rpx">
            <wd-input v-model="sendForm.userIds" clearable placeholder="多个用户编号用英文逗号分隔" />
          </wd-form-item>
        </wd-cell-group>
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="sendVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleSend">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionCoupon } from '@/api/mall/promotion/coupon/coupon'
import { onUnload } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { getPromotionCouponPage, sendPromotionCoupon } from '@/api/mall/promotion/coupon/coupon'
import { useAccess } from '@/hooks/useAccess'
import { formatMallMoney } from '@/pages-mall/utils'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const list = ref<PromotionCoupon[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const sendVisible = ref(false) // 发送弹窗
const submitting = ref(false) // 发送提交状态
const sendForm = reactive({ templateId: '', userIds: '' }) // 发送表单
const canSend = computed(() => hasAccessByCodes(['promotion:coupon:send']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询优惠券列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPromotionCouponPage({ ...queryParams.value, pageNo, pageSize })
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

/** 发送优惠券 */
async function handleSend() {
  const templateId = Number(sendForm.templateId)
  const userIds = String(sendForm.userIds).split(/[,，]/).map(item => Number(item.trim())).filter(item => !Number.isNaN(item))
  if (!templateId || !userIds.length) {
    toast.warning('请填写模板编号与用户编号')
    return
  }
  submitting.value = true
  try {
    await sendPromotionCoupon({ templateId, userIds })
    toast.success('发送成功')
    sendVisible.value = false
    sendForm.templateId = ''
    sendForm.userIds = ''
    reload()
  } finally {
    submitting.value = false
  }
}

/** 查看详情：优惠券接口无 get，详情字段经路由参数透传 */
function handleDetail(item: PromotionCoupon) {
  const query = [
    `id=${item.id}`,
    item.name ? `name=${encodeURIComponent(item.name)}` : '',
    item.templateId != null ? `templateId=${item.templateId}` : '',
    item.userId != null ? `userId=${item.userId}` : '',
    item.discountType != null ? `discountType=${item.discountType}` : '',
    item.status != null ? `status=${item.status}` : '',
    item.usePrice != null ? `usePrice=${item.usePrice}` : '',
    item.discountPrice != null ? `discountPrice=${item.discountPrice}` : '',
    item.useTime ? `useTime=${encodeURIComponent(item.useTime)}` : '',
    item.createTime ? `createTime=${encodeURIComponent(item.createTime)}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-mall/promotion/coupon/detail/index?${query}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mall:promotion-coupon:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-coupon:reload', reload)
})
</script>
