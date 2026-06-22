<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="订单详情"
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
                下单时间：{{ formatDateTime(formData.createTime) || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="formData.status" />
          </view>
          <view class="grid grid-cols-2 gap-x-20rpx gap-y-12rpx text-26rpx">
            <view><text class="text-[#999]">买家：</text>{{ formData.user?.nickname || '-' }}</view>
            <view><text class="text-[#999]">来源：</text>{{ getDictLabel(DICT_TYPE.TERMINAL, formData.terminal) || '-' }}</view>
            <view><text class="text-[#999]">类型：</text>{{ getDictLabel(DICT_TYPE.TRADE_ORDER_TYPE, formData.type) || '-' }}</view>
            <view><text class="text-[#999]">支付：</text>{{ formData.payStatus ? '已支付' : '未支付' }}</view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            金额信息
          </view>
          <view class="grid grid-cols-2 gap-x-20rpx gap-y-12rpx text-26rpx">
            <view><text class="text-[#999]">商品原价：</text>{{ formatMallMoney(formData.totalPrice) }}</view>
            <view><text class="text-[#999]">运费：</text>{{ formatMallMoney(formData.deliveryPrice) }}</view>
            <view><text class="text-[#999]">优惠金额：</text>{{ formatMallMoney(formData.discountPrice) }}</view>
            <view><text class="text-[#999]">优惠券：</text>{{ formatMallMoney(formData.couponPrice) }}</view>
            <view><text class="text-[#999]">积分抵扣：</text>{{ formatMallMoney(formData.pointPrice) }}</view>
            <view><text class="text-[#999]">VIP 优惠：</text>{{ formatMallMoney(formData.vipPrice) }}</view>
            <view><text class="text-[#999]">订单调价：</text>{{ formatMallMoney(formData.adjustPrice) }}</view>
            <view class="text-[#fa4350] font-semibold">
              <text>实付：</text>{{ formatMallMoney(formData.payPrice) }}
            </view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            收货与配送
          </view>
          <view class="text-26rpx text-[#333] space-y-10rpx">
            <view><text class="text-[#999]">配送方式：</text>{{ getDictLabel(DICT_TYPE.TRADE_DELIVERY_TYPE, formData.deliveryType) || '-' }}</view>
            <view><text class="text-[#999]">收件人：</text>{{ formData.receiverName || '-' }}</view>
            <view><text class="text-[#999]">联系电话：</text>{{ formData.receiverMobile || '-' }}</view>
            <view><text class="text-[#999]">收货地址：</text>{{ formData.receiverAreaName || '' }} {{ formData.receiverDetailAddress || '' }}</view>
            <view v-if="formData.pickUpVerifyCode">
              <text class="text-[#999]">核销码：</text>{{ formData.pickUpVerifyCode }}
            </view>
            <view v-if="formData.logisticsNo">
              <text class="text-[#999]">物流单号：</text>{{ formData.logisticsNo }}
            </view>
            <view v-if="expressTracks.length">
              <text class="text-[#999]">物流轨迹：</text>
              <view class="mt-8rpx rounded-8rpx bg-[#f8f8f8] p-16rpx">
                <view v-for="(item, index) in expressTracks" :key="index" class="mb-8rpx last:mb-0">
                  {{ item.time || item.createTime || '' }} {{ item.content || item.context || '' }}
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            商品明细
          </view>
          <view
            v-for="item in formData.items || []"
            :key="item.id"
            class="mb-16rpx flex gap-20rpx rounded-8rpx bg-[#f8f8f8] p-16rpx last:mb-0"
          >
            <image
              v-if="item.picUrl"
              :src="item.picUrl"
              class="h-112rpx w-112rpx shrink-0 rounded-8rpx bg-[#eee]"
              mode="aspectFill"
            />
            <view class="min-w-0 flex-1">
              <view class="line-clamp-2 text-28rpx text-[#333] font-semibold">
                {{ item.spuName || '-' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#777]">
                x{{ item.count || 0 }} / {{ formatMallMoney(item.payPrice) }}
              </view>
              <view v-if="item.properties?.length" class="mt-8rpx text-22rpx text-[#999]">
                {{ item.properties.map(prop => `${prop.propertyName}:${prop.valueName}`).join('；') }}
              </view>
            </view>
          </view>
        </view>

        <view class="mb-160rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            备注与日志
          </view>
          <view class="mb-16rpx rounded-8rpx bg-[#f8f8f8] p-16rpx text-26rpx">
            <view><text class="text-[#999]">买家留言：</text>{{ formData.userRemark || '-' }}</view>
            <view class="mt-8rpx">
              <text class="text-[#999]">商家备注：</text>{{ formData.remark || '-' }}
            </view>
          </view>
          <view v-for="(log, index) in formData.logs || []" :key="index" class="mb-12rpx text-24rpx text-[#666] last:mb-0">
            <text class="text-[#999]">{{ formatDateTime(log.createTime) || '-' }}</text>
            <text class="ml-12rpx">{{ log.content || '-' }}</text>
          </view>
        </view>
      </view>

      <wd-empty v-else icon="content" tip="订单不存在" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="formData && (showRemarkButton || sheetActions.length)" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="showRemarkButton" class="flex-1" type="warning" @click="openAction('remark')">
          备注
        </wd-button>
        <wd-button v-if="sheetActions.length" class="flex-1" type="info" @click="actionSheetVisible = true">
          更多
        </wd-button>
      </view>
    </view>

    <!-- 更多操作菜单 -->
    <wd-action-sheet v-model="actionSheetVisible" :actions="sheetActions" @select="handleSelectAction" />

    <!-- 动作表单 -->
    <wd-popup
      v-model="actionFormVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="closeActionForm"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          {{ currentAction?.label }}
        </view>
        <wd-form ref="actionFormRef" :model="actionFormData" :schema="actionFormSchema">
          <wd-cell-group border>
            <template v-for="field in currentFields" :key="field.prop">
              <!-- 地区选择：yd-tree-select 自带 wd-form-item，需独立渲染 -->
              <yd-tree-select
                v-if="field.type === 'area'"
                v-model="actionFormData[field.prop]"
                :label="field.label"
                :prop="field.prop"
                label-width="200rpx"
                :data="areaTree"
                :placeholder="field.placeholder || `请选择${field.label}`"
              />
              <wd-form-item
                v-else
                :title="field.label"
                title-width="200rpx"
                :prop="field.prop"
              >
                <wd-input
                  v-if="field.type === 'text'"
                  v-model="actionFormData[field.prop]"
                  clearable
                  :placeholder="field.placeholder || `请输入${field.label}`"
                />
                <wd-input-number
                  v-else-if="field.type === 'number'"
                  v-model="actionFormData[field.prop]"
                  :min="field.min ?? 0"
                  :max="field.max"
                />
                <wd-input-number
                  v-else-if="field.type === 'money'"
                  v-model="actionFormData[field.prop]"
                  :min="field.min ?? -999999"
                  :max="field.max"
                  :step="0.01"
                />
                <wd-textarea
                  v-else
                  v-model="actionFormData[field.prop]"
                  clearable
                  :maxlength="2000"
                  :placeholder="field.placeholder || `请输入${field.label}`"
                />
              </wd-form-item>
            </template>
          </wd-cell-group>
        </wd-form>
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="closeActionForm">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="actionSubmitting" @click="submitActionForm">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { TradeOrder } from '@/api/mall/trade/order'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deliveryTradeOrder,
  getTradeOrder,
  getTradeOrderExpressTrackList,
  pickUpTradeOrder,
  updateTradeOrderAddress,
  updateTradeOrderPrice,
  updateTradeOrderRemark,
} from '@/api/mall/trade/order'
import { getAreaTree } from '@/api/system/area'
import { getDictLabel } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import { formatMallMoney } from '@/pages-mall/utils'
import { currRoute, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

interface ActionField {
  prop: string
  label: string
  type: 'area' | 'money' | 'number' | 'text' | 'textarea'
  required?: boolean
  min?: number
  max?: number
  placeholder?: string
}

interface DetailAction {
  key: string
  label: string
  fields?: ActionField[]
  defaults?: () => Record<string, any>
  confirm?: string
  visible?: () => boolean
  handler: (data?: Record<string, any>) => Promise<unknown>
}

// 订单状态：0 待付款、10 待发货、20 待收货、30 已完成、40 已取消
const ORDER_STATUS = { UNPAID: 0, UNDELIVERED: 10 }
// 配送方式：1 快递、2 自提
const DELIVERY_TYPE = { EXPRESS: 1, PICK_UP: 2 }

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<TradeOrder>() // 订单详情
const detailId = ref<number>() // 订单编号
const expressTracks = ref<Record<string, any>[]>([]) // 物流轨迹
const areaTree = ref<any[]>([]) // 地区树（修改地址用）
const actionSheetVisible = ref(false) // 更多菜单
const actionFormVisible = ref(false) // 动作表单
const actionSubmitting = ref(false) // 动作提交状态
const currentAction = ref<DetailAction>() // 当前动作
const actionFormData = ref<Record<string, any>>({}) // 动作表单数据
const actionFormRef = ref<FormInstance>() // 动作表单引用
const actions = computed<DetailAction[]>(() => {
  const status = formData.value?.status
  const deliveryType = formData.value?.deliveryType
  const canUpdate = hasAccessByCodes(['trade:order:update'])
  const canPickUp = hasAccessByCodes(['trade:order:pick-up'])
  const result: DetailAction[] = [
    {
      key: 'delivery',
      label: '订单发货',
      // 仅「待发货 + 快递」可发货
      visible: () => canUpdate && status === ORDER_STATUS.UNDELIVERED && deliveryType === DELIVERY_TYPE.EXPRESS,
      fields: [
        { prop: 'logisticsId', label: '快递公司编号', type: 'number' },
        { prop: 'logisticsNo', label: '快递单号', type: 'text', required: true },
      ],
      defaults: () => ({ logisticsId: formData.value?.logisticsId, logisticsNo: formData.value?.logisticsNo || '' }),
      handler: data => deliveryTradeOrder({ id: detailId.value, logisticsId: data?.logisticsId ?? null, logisticsNo: String(data?.logisticsNo || '') }),
    },
    {
      key: 'remark',
      label: '修改备注',
      // 备注任意状态可改
      visible: () => canUpdate,
      fields: [{ prop: 'remark', label: '商家备注', type: 'textarea', required: true }],
      defaults: () => ({ remark: formData.value?.remark || '' }),
      handler: data => updateTradeOrderRemark({ id: detailId.value, remark: data?.remark }),
    },
    {
      key: 'price',
      label: '订单改价',
      // 仅「待付款」可改价
      visible: () => canUpdate && status === ORDER_STATUS.UNPAID,
      fields: [{ prop: 'adjustPrice', label: '订单调价', type: 'money', required: true, min: -999999, placeholder: '正数加价，负数减价' }],
      defaults: () => ({ adjustPrice: Number(formData.value?.adjustPrice || 0) / 100 }),
      handler: data => updateTradeOrderPrice({ id: detailId.value, adjustPrice: Math.round(Number(data?.adjustPrice || 0) * 100) }),
    },
    {
      key: 'address',
      label: '修改地址',
      // 仅「待发货 + 快递」可改地址
      visible: () => canUpdate && status === ORDER_STATUS.UNDELIVERED && deliveryType === DELIVERY_TYPE.EXPRESS,
      fields: [
        { prop: 'receiverName', label: '收件人', type: 'text', required: true },
        { prop: 'receiverMobile', label: '手机号', type: 'text', required: true },
        { prop: 'receiverAreaId', label: '所在地区', type: 'area', required: true },
        { prop: 'receiverDetailAddress', label: '详细地址', type: 'textarea', required: true },
      ],
      defaults: () => ({
        receiverName: formData.value?.receiverName || '',
        receiverMobile: formData.value?.receiverMobile || '',
        receiverAreaId: formData.value?.receiverAreaId,
        receiverDetailAddress: formData.value?.receiverDetailAddress || '',
      }),
      handler: data => updateTradeOrderAddress({ id: detailId.value, ...data }),
    },
    {
      key: 'pick-up',
      label: '订单核销',
      // 仅「待发货 + 自提」可核销
      visible: () => canPickUp && status === ORDER_STATUS.UNDELIVERED && deliveryType === DELIVERY_TYPE.PICK_UP,
      confirm: '确定要核销该订单吗？',
      handler: () => pickUpTradeOrder(Number(detailId.value)),
    },
  ]
  return result.filter(item => item.visible?.() ?? true)
})
const showRemarkButton = computed(() => actions.value.some(item => item.key === 'remark')) // 备注按钮可见
const sheetActions = computed(() => actions.value
  .filter(item => item.key !== 'remark')
  .map(item => ({ name: item.label, value: item.key })))
const currentFields = computed(() => currentAction.value?.fields || [])
const actionFormSchema = createFormSchema(() => {
  const rules: Record<string, any> = {}
  currentFields.value.forEach((field) => {
    if (field.required) {
      rules[field.prop] = [{ required: true, message: `${field.label}不能为空` }]
    }
  })
  return rules
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/order/index')
}

/** 加载详情 */
async function loadDetail() {
  if (!detailId.value) {
    return
  }
  formData.value = await getTradeOrder(detailId.value)
  if (formData.value.logisticsId) {
    expressTracks.value = await getTradeOrderExpressTrackList(detailId.value)
  } else {
    expressTracks.value = []
  }
}

/** 打开动作 */
function openAction(key: string) {
  const action = actions.value.find(item => item.key === key)
  if (!action) {
    return
  }
  currentAction.value = action
  if (action.fields?.length) {
    actionFormData.value = action.defaults?.() || {}
    actionFormVisible.value = true
    return
  }
  runAction(action)
}

/** 选择更多动作 */
function handleSelectAction({ item }: { item: { value: string } }) {
  openAction(item.value)
}

/** 关闭动作表单 */
function closeActionForm() {
  actionFormVisible.value = false
  actionFormData.value = {}
  currentAction.value = undefined
}

/** 提交动作表单 */
async function submitActionForm() {
  const result = await actionFormRef.value?.validate()
  if (!result?.valid || !currentAction.value) {
    return
  }
  await runAction(currentAction.value, actionFormData.value)
  closeActionForm()
}

/** 执行动作 */
async function runAction(action: DetailAction, data?: Record<string, any>) {
  if (action.confirm) {
    try {
      await dialog.confirm({ title: '提示', msg: action.confirm })
    } catch {
      return
    }
  }
  actionSubmitting.value = true
  try {
    await action.handler(data)
    toast.success('操作成功')
    uni.$emit('mall:trade-order:reload')
    await loadDetail()
  } finally {
    actionSubmitting.value = false
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
  await Promise.all([
    loadDetail(),
    getAreaTree().then((list) => {
      areaTree.value = list
    }),
  ])
})
</script>

<style lang="scss" scoped>
</style>
