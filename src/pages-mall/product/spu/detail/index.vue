<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商品详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view class="p-24rpx">
      <!-- 基础信息 -->
      <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
        <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
          基础信息
        </view>
        <wd-cell-group border>
          <wd-cell title="商品名称" :value="formData.name || '-'" />
          <wd-cell title="商品分类" :value="formData.categoryName || '-'" />
          <wd-cell title="商品品牌" :value="formData.brandName || '-'" />
          <wd-cell title="关键字" :value="formData.keyword || '-'" />
          <wd-cell title="商品状态">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.PRODUCT_SPU_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
        </wd-cell-group>
      </view>

      <!-- 价格库存 -->
      <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
        <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
          价格库存
        </view>
        <wd-cell-group border>
          <wd-cell title="销售价" :value="formatMallMoney(formData.price)" />
          <wd-cell title="市场价" :value="formatMallMoney(formData.marketPrice)" />
          <wd-cell title="成本价" :value="formatMallMoney(formData.costPrice)" />
          <wd-cell title="库存" :value="formData.stock != null ? String(formData.stock) : '-'" />
          <wd-cell title="销量" :value="formData.salesCount != null ? String(formData.salesCount) : '-'" />
          <wd-cell title="虚拟销量" :value="formData.virtualSalesCount != null ? String(formData.virtualSalesCount) : '-'" />
        </wd-cell-group>
      </view>

      <!-- 商品图片 -->
      <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
        <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
          商品图片
        </view>
        <view class="p-24rpx">
          <view class="mb-12rpx text-26rpx text-[#999]">
            商品封面
          </view>
          <image
            v-if="formData.picUrl"
            :src="formData.picUrl"
            class="mb-20rpx h-160rpx w-160rpx rounded-8rpx bg-[#f5f5f5]"
            mode="aspectFill"
          />
          <text v-else class="mb-20rpx block text-26rpx text-[#666]">-</text>
          <view class="mb-12rpx text-26rpx text-[#999]">
            轮播图
          </view>
          <view v-if="sliderPicUrls.length" class="flex flex-wrap gap-12rpx">
            <image
              v-for="(pic, index) in sliderPicUrls"
              :key="index"
              :src="pic"
              class="h-140rpx w-140rpx rounded-8rpx bg-[#f5f5f5]"
              mode="aspectFill"
            />
          </view>
          <text v-else class="text-26rpx text-[#666]">-</text>
        </view>
      </view>

      <!-- 商品简介 -->
      <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
        <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
          商品简介
        </view>
        <view class="p-24rpx text-28rpx text-[#666] leading-relaxed">
          {{ formData.introduction || '-' }}
        </view>
      </view>
    </view>

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
import type { ProductSpu } from '@/api/mall/product/spu'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteProductSpu, getProductSpu } from '@/api/mall/product/spu'
import { useAccess } from '@/hooks/useAccess'
import { formatMallMoney } from '@/pages-mall/utils'
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
const formData = ref<ProductSpu>({}) // 详情数据
const deleting = ref(false) // 删除状态
const canUpdate = computed(() => hasAccessByCodes(['product:spu:update']))
const canDelete = computed(() => hasAccessByCodes(['product:spu:delete']))

/** 轮播图列表 */
const sliderPicUrls = computed(() => formData.value.sliderPicUrls || [])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/spu/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProductSpu(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/product/spu/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该商品吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProductSpu(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mall:product-spu:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:product-spu:reload', getDetail)
  uni.$on('mall:productSpu:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:product-spu:reload', getDetail)
  uni.$off('mall:productSpu:reload', getDetail)
})
</script>
