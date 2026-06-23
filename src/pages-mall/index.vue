<template>
  <view class="yd-page-container">
    <!-- TODO @AI：挪到 /Users/yunai/Java/yudao-ui-admin-uniapp-next-v4/src/pages-statistics/mall/home 里；然后去掉快捷入口，重点保留表单，对齐 /Users/yunai/Java/yudao-ui-admin-vue3/src/views/mall/home/index.vue -->
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商城工作台"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <!-- 核心数据 -->
        <view class="grid grid-cols-2 gap-20rpx">
          <view
            v-for="item in comparisonCards"
            :key="item.key"
            class="rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="text-24rpx text-[#999]">
              {{ item.label }}
            </view>
            <view class="mt-12rpx text-40rpx text-[#333] font-semibold">
              {{ item.value }}
            </view>
            <view class="mt-8rpx text-22rpx text-[#999]">
              昨日 {{ item.reference }}
            </view>
          </view>
        </view>

        <!-- 运营数据 -->
        <view class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-20rpx text-30rpx text-[#333] font-semibold">
            运营数据
          </view>
          <view class="grid grid-cols-2 gap-20rpx">
            <view
              v-for="item in operationCards"
              :key="item.key"
              class="rounded-8rpx bg-[#f7f8fa] px-20rpx py-18rpx"
              @click="handleOpen(item.route)"
            >
              <view class="text-24rpx text-[#999]">
                {{ item.label }}
              </view>
              <view class="mt-8rpx text-34rpx text-[#333] font-semibold">
                {{ item.value }}
              </view>
            </view>
          </view>
        </view>

        <!-- 资源分组 -->
        <view
          v-for="group in visibleGroups"
          :key="group.key"
          class="mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="px-24rpx pt-24rpx text-30rpx text-[#333] font-semibold">
            {{ group.name }}
          </view>
          <wd-grid :column="3" clickable :border="false">
            <wd-grid-item
              v-for="item in group.items"
              :key="item.route"
              :text="item.title"
              @click="handleOpen(item.route)"
            >
              <template #icon>
                <view class="h-72rpx w-72rpx flex items-center justify-center rounded-16rpx bg-[#e6f4ff]">
                  <wd-icon :name="item.icon" size="44rpx" color="#1677ff" />
                </view>
              </template>
            </wd-grid-item>
          </wd-grid>
        </view>

        <!-- 底部安全区域 -->
        <view class="h-40rpx" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { getProductSpuTabsCount } from '@/api/mall/product/spu'
import {
  getMemberUserCountComparison,
  getTradeOrderComparison,
  getTradeOrderCount,
  getWalletRechargePrice,
} from '@/api/mall/statistics'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()

const mallGroups = [ // 商城资源分组（指向逐模块显式页）
  {
    key: 'statistics',
    name: '数据统计',
    items: [ // 统计页在 pages-statistics（含 echart 图表），工作台仅作入口
      { title: '交易统计', route: '/pages-statistics/mall/trade/index', permission: '', icon: 'dashboard' },
      { title: '商品统计', route: '/pages-statistics/mall/product/index', permission: '', icon: 'dashboard' },
      { title: '会员统计', route: '/pages-statistics/mall/member/index', permission: '', icon: 'dashboard' },
    ],
  },
  {
    key: 'product',
    name: '商品中心',
    items: [
      { title: '商品', route: '/pages-mall/product/spu/index', permission: 'product:spu:query', icon: 'goods' },
      { title: '品牌', route: '/pages-mall/product/brand/index', permission: 'product:brand:query', icon: 'shop' },
      { title: '分类', route: '/pages-mall/product/category/index', permission: 'product:category:query', icon: 'app' },
      { title: '属性', route: '/pages-mall/product/property/index', permission: 'product:property:query', icon: 'list' },
      { title: '评论', route: '/pages-mall/product/comment/index', permission: 'product:comment:query', icon: 'chat' },
    ],
  },
  {
    key: 'trade',
    name: '交易中心',
    items: [
      { title: '订单', route: '/pages-mall/trade/order/index', permission: 'trade:order:query', icon: 'list' },
      { title: '售后', route: '/pages-mall/trade/after-sale/index', permission: 'trade:after-sale:query', icon: 'refresh' },
      { title: '快递公司', route: '/pages-mall/trade/delivery/express/index', permission: 'trade:delivery:express:query', icon: 'send' },
      { title: '运费模板', route: '/pages-mall/trade/delivery/express-template/index', permission: 'trade:delivery:express-template:query', icon: 'file' },
      { title: '自提门店', route: '/pages-mall/trade/delivery/pick-up-store/index', permission: 'trade:delivery:pick-up-store:query', icon: 'shop' },
      { title: '核销订单', route: '/pages-mall/trade/delivery/pick-up-order/index', permission: 'trade:order:query', icon: 'scan' },
      { title: '交易配置', route: '/pages-mall/trade/config/index', permission: 'trade:config:query', icon: 'setting' },
      { title: '分销用户', route: '/pages-mall/trade/brokerage/user/index', permission: 'trade:brokerage-user:query', icon: 'user' },
      { title: '佣金记录', route: '/pages-mall/trade/brokerage/record/index', permission: 'trade:brokerage-record:query', icon: 'list' },
      { title: '佣金提现', route: '/pages-mall/trade/brokerage/withdraw/index', permission: 'trade:brokerage-withdraw:query', icon: 'wallet' },
    ],
  },
  {
    key: 'promotion',
    name: '营销中心',
    items: [
      { title: 'Banner', route: '/pages-mall/promotion/banner/index', permission: 'promotion:banner:query', icon: 'picture' },
      { title: '文章', route: '/pages-mall/promotion/article/index', permission: 'promotion:article:query', icon: 'edit' },
      { title: '文章分类', route: '/pages-mall/promotion/article/category/index', permission: 'promotion:article-category:query', icon: 'folder' },
      { title: '优惠券模板', route: '/pages-mall/promotion/coupon/template/index', permission: 'promotion:coupon-template:query', icon: 'coupon' },
      { title: '优惠券', route: '/pages-mall/promotion/coupon/index', permission: 'promotion:coupon:query', icon: 'coupon' },
      { title: '限时折扣', route: '/pages-mall/promotion/discount-activity/index', permission: 'promotion:discount-activity:query', icon: 'tag' },
      { title: '满减送', route: '/pages-mall/promotion/reward-activity/index', permission: 'promotion:reward-activity:query', icon: 'gift' },
      { title: '秒杀活动', route: '/pages-mall/promotion/seckill/activity/index', permission: 'promotion:seckill-activity:query', icon: 'clock' },
      { title: '秒杀时段', route: '/pages-mall/promotion/seckill/config/index', permission: 'promotion:seckill-config:query', icon: 'setting' },
      { title: '拼团活动', route: '/pages-mall/promotion/combination/activity/index', permission: 'promotion:combination-activity:query', icon: 'usergroup' },
      { title: '拼团记录', route: '/pages-mall/promotion/combination/record/index', permission: 'promotion:combination-record:query', icon: 'list' },
      { title: '砍价活动', route: '/pages-mall/promotion/bargain/activity/index', permission: 'promotion:bargain-activity:query', icon: 'scissors' },
      { title: '砍价记录', route: '/pages-mall/promotion/bargain/record/index', permission: 'promotion:bargain-record:query', icon: 'list' },
      { title: '砍价助力', route: '/pages-mall/promotion/bargain/help/index', permission: 'promotion:bargain-help:query', icon: 'usergroup' },
      { title: '积分商城', route: '/pages-mall/promotion/point/activity/index', permission: 'promotion:point-activity:query', icon: 'star' },
      { title: '装修页面', route: '/pages-mall/promotion/diy/page/index', permission: 'promotion:diy-page:query', icon: 'view-list' },
      { title: '装修模板', route: '/pages-mall/promotion/diy/template/index', permission: 'promotion:diy-template:query', icon: 'copy' },
      { title: '客服会话', route: '/pages-mall/kefu/index', permission: 'promotion:kefu-conversation:query', icon: 'chat' },
    ],
  },
]

const comparisonCards = ref([
  { key: 'payPrice', label: '今日销售额', value: '-', reference: '-' },
  { key: 'visitUser', label: '用户访问量', value: '-', reference: '-' },
  { key: 'orderCount', label: '订单量', value: '-', reference: '-' },
  { key: 'registerUser', label: '新增用户', value: '-', reference: '-' },
]) // 核心数据
const operationCards = ref([
  { key: 'undelivered', label: '待发货订单', value: '-', route: '/pages-mall/trade/order/index' },
  { key: 'afterSaleApply', label: '退款中订单', value: '-', route: '/pages-mall/trade/after-sale/index' },
  { key: 'pickUp', label: '待核销订单', value: '-', route: '/pages-mall/trade/delivery/pick-up-order/index' },
  { key: 'productForSale', label: '上架商品', value: '-', route: '/pages-mall/product/spu/index' },
  { key: 'productWarehouse', label: '仓库商品', value: '-', route: '/pages-mall/product/spu/index' },
  { key: 'productAlertStock', label: '库存预警', value: '-', route: '/pages-mall/product/spu/index' },
  { key: 'withdrawAuditing', label: '提现待审核', value: '-', route: '/pages-mall/trade/brokerage/withdraw/index' },
  { key: 'rechargePrice', label: '账户充值', value: '-', route: '/pages-mall/trade/order/index' },
]) // 运营数据

/** 可见资源分组（按权限过滤） */
const visibleGroups = computed(() => {
  return mallGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasPermission(item.permission)),
    }))
    .filter(group => group.items.length > 0)
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 判断权限 */
function hasPermission(code?: string) {
  return !code || hasAccessByCodes([code])
}

/** 打开资源列表 */
function handleOpen(route: string) {
  uni.navigateTo({ url: route })
}

/** 更新核心数据 */
function updateComparisonCard(key: string, value: string | number, reference: string | number) {
  const item = comparisonCards.value.find(card => card.key === key)
  if (item) {
    item.value = String(value)
    item.reference = String(reference)
  }
}

/** 更新运营数据 */
function updateOperationCard(key: string, value: string | number) {
  const item = operationCards.value.find(card => card.key === key)
  if (item) {
    item.value = String(value)
  }
}

/** 加载统计数据 */
async function loadStatistics() {
  const [orderComparison, userComparison, orderCount, productCount, paySummary] = await Promise.allSettled([
    getTradeOrderComparison(),
    getMemberUserCountComparison(),
    getTradeOrderCount(),
    getProductSpuTabsCount(),
    getWalletRechargePrice(),
  ])

  if (orderComparison.status === 'fulfilled') {
    updateComparisonCard('payPrice', formatDisplayMoney(orderComparison.value.value?.orderPayPrice), formatDisplayMoney(orderComparison.value.reference?.orderPayPrice))
    updateComparisonCard('orderCount', orderComparison.value.value?.orderPayCount || 0, orderComparison.value.reference?.orderPayCount || 0)
  }
  if (userComparison.status === 'fulfilled') {
    updateComparisonCard('visitUser', userComparison.value.value?.visitUserCount || 0, userComparison.value.reference?.visitUserCount || 0)
    updateComparisonCard('registerUser', userComparison.value.value?.registerUserCount || 0, userComparison.value.reference?.registerUserCount || 0)
  }
  if (orderCount.status === 'fulfilled') {
    updateOperationCard('undelivered', orderCount.value.undelivered || 0)
    updateOperationCard('afterSaleApply', orderCount.value.afterSaleApply || 0)
    updateOperationCard('pickUp', orderCount.value.pickUp || 0)
    updateOperationCard('withdrawAuditing', orderCount.value.auditingWithdraw || 0)
  }
  if (productCount.status === 'fulfilled') {
    updateOperationCard('productForSale', productCount.value['0'] || 0)
    updateOperationCard('productWarehouse', productCount.value['1'] || 0)
    updateOperationCard('productAlertStock', productCount.value['3'] || 0)
  }
  if (paySummary.status === 'fulfilled') {
    updateOperationCard('rechargePrice', formatDisplayMoney(paySummary.value.rechargePrice || 0))
  }
}

/** 初始化 */
onMounted(() => {
  loadStatistics()
})
</script>

<style lang="scss" scoped>
:deep(.wd-grid-item__text) {
  font-size: 24rpx;
  color: #333;
  overflow: visible;
  white-space: nowrap;
}
</style>
