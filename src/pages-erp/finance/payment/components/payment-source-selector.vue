<!-- TODO @AI：对齐 vue3 + ep 的位置和拆分方式？（名字可以用 picker 或者 select 啥，和现有项目风格一致） -->
<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="visible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="selectedRows.length === 0" @click="handleConfirm">
          确定{{ selectedRows.length ? `(${selectedRows.length})` : '' }}
        </wd-button>
      </view>

      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.no" :placeholder="`请输入${sourceLabel}单号`" clearable />
        <!-- TODO @Yunai：产品选择对齐 yd-form-picker/ErpPicker，不要在弹窗里直接散落 wd-picker。 -->
        <wd-form-item class="mt-12rpx" :value="productDisplayValue" placeholder="请选择产品" is-link @click="productPickerVisible = true" />
        <wd-picker v-model:visible="productPickerVisible" :model-value="queryParams.productId" :columns="productOptions" label-key="name" value-key="id" @confirm="({ value }) => queryParams.productId = value[0]" />
        <!-- TODO @Yunai：时间范围对齐 yd-search-date-range 或抽公共组件，避免手写双 datetime-picker。 -->
        <view class="mt-12rpx flex gap-12rpx">
          <view class="flex-1" @click="dateVisible.start = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(queryParams.time[0]) || '开始日期' }}
            </view>
          </view>
          <view class="flex-1" @click="dateVisible.end = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(queryParams.time[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker v-model="queryParams.time[0]" v-model:visible="dateVisible.start" title="请选择开始日期" type="date" />
        <wd-datetime-picker v-model="queryParams.time[1]" v-model:visible="dateVisible.end" title="请选择结束日期" type="date" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>

      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleLoadMore">
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="isSelected(item) ? 'ring-2 ring-[#1677ff]' : ''"
            @click="toggleSelect(item)"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.no || '-' }}
              </view>
              <text v-if="isSelected(item)" class="shrink-0 text-24rpx text-[#1677ff]">已选择</text>
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">供应商：</text>{{ item.supplierName || '-' }}
            </view>
            <view v-if="item.productNames" class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">产品：</text>
              <text class="line-clamp-1">{{ item.productNames }}</text>
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">{{ timeLabel }}：</text>{{ formatDateTime(item[timeField]) || '-' }}
            </view>
            <view class="flex text-26rpx text-[#666]">
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">{{ totalLabel }}：</text>{{ formatMoney(item.totalPrice) }}
              </view>
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">{{ paidLabel }}：</text>{{ formatMoney(item[paidField]) }}
              </view>
            </view>
          </view>
          <view v-if="!loading && list.length === 0" class="py-80rpx text-center">
            <wd-empty icon="content" :tip="`暂无可选择${sourceLabel}`" />
          </view>
          <view v-if="loading" class="py-24rpx text-center text-26rpx text-[#999]">
            加载中...
          </view>
          <view v-else-if="finished && list.length > 0" class="py-24rpx text-center text-26rpx text-[#999]">
            没有更多了
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/erp/product/product'
import { computed, reactive, ref } from 'vue'
import { getProductSimpleList } from '@/api/erp/product/product'
import { getPurchaseInPage } from '@/api/erp/purchase/in'
import { getPurchaseReturnPage } from '@/api/erp/purchase/return'
import { formatDate, formatDateRange, formatDateTime } from '@/utils/date'
import { getWotPickerFormValue } from '@/utils/wot'
import { formatMoney } from '@/pages-erp/utils'

type SourceType = 'purchase-in' | 'purchase-return'

const props = defineProps<{
  source: SourceType
}>()

const emit = defineEmits<{
  success: [rows: Record<string, any>[]]
}>()

const visible = ref(false)
const loading = ref(false)
const finished = ref(false)
const pageNo = ref(1)
const pageSize = 10
const total = ref(0)
const supplierId = ref<number>()
const list = ref<Record<string, any>[]>([])
const selectedRows = ref<Record<string, any>[]>([])
const productOptions = ref<Product[]>([])
const productPickerVisible = ref(false)
const dateVisible = reactive({ start: false, end: false })
const queryParams = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  time: ['', ''] as [any, any],
})

const isPurchaseIn = computed(() => props.source === 'purchase-in')
const title = computed(() => isPurchaseIn.value ? '选择采购入库（仅展示可付款）' : '选择采购退货（仅展示可退款）')
const sourceLabel = computed(() => isPurchaseIn.value ? '采购入库' : '采购退货')
const timeField = computed(() => isPurchaseIn.value ? 'inTime' : 'returnTime')
const timeLabel = computed(() => isPurchaseIn.value ? '入库时间' : '退货时间')
const paidField = computed(() => isPurchaseIn.value ? 'paymentPrice' : 'refundPrice')
const paidLabel = computed(() => isPurchaseIn.value ? '已付金额' : '已退金额')
const totalLabel = computed(() => isPurchaseIn.value ? '应付金额' : '应退金额')
const productDisplayValue = computed(() => getWotPickerFormValue(productOptions.value, queryParams.productId, { valueKey: 'id', labelKey: 'name' }))

function isSelected(item: Record<string, any>) {
  return selectedRows.value.some(row => String(row.id) === String(item.id))
}

function toggleSelect(item: Record<string, any>) {
  if (isSelected(item)) {
    selectedRows.value = selectedRows.value.filter(row => String(row.id) !== String(item.id))
  } else {
    selectedRows.value.push(item)
  }
}

/** 查询可选单据列表 */
async function queryList(reset = false) {
  if (loading.value) {
    return
  }
  if (reset) {
    pageNo.value = 1
    list.value = []
    selectedRows.value = []
    finished.value = false
  }
  if (finished.value) {
    return
  }
  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize,
      no: queryParams.no || undefined,
      productId: queryParams.productId,
      supplierId: supplierId.value,
      [timeField.value]: formatDateRange(queryParams.time),
      ...(isPurchaseIn.value ? { paymentEnable: true } : { refundEnable: true }),
    }
    const data = isPurchaseIn.value ? await getPurchaseInPage(params) : await getPurchaseReturnPage(params)
    list.value = reset ? data.list : list.value.concat(data.list)
    total.value = data.total
    finished.value = list.value.length >= total.value
    pageNo.value += 1
  } finally {
    loading.value = false
  }
}

async function open(nextSupplierId: number) {
  supplierId.value = nextSupplierId
  visible.value = true
  if (productOptions.value.length === 0) {
    productOptions.value = await getProductSimpleList()
  }
  await queryList(true)
}

function handleSearch() {
  queryList(true)
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.no = undefined
  queryParams.productId = undefined
  queryParams.time = ['', '']
  queryList(true)
}

function handleLoadMore() {
  queryList()
}

function handleConfirm() {
  emit('success', selectedRows.value)
  visible.value = false
}

defineExpose({ open })
</script>
