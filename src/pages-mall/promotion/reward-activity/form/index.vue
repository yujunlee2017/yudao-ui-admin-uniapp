<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <view class="p-24rpx">
          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              活动信息
            </view>
            <wd-cell-group border>
              <wd-form-item title="活动名称" title-width="200rpx" prop="name">
                <wd-input v-model="formData.name" clearable placeholder="请输入活动名称" />
              </wd-form-item>
              <wd-datetime-picker v-model="formData.startTime" type="datetime" label="开始时间" label-width="200rpx" prop="startTime" placeholder="请选择开始时间" />
              <wd-datetime-picker v-model="formData.endTime" type="datetime" label="结束时间" label-width="200rpx" prop="endTime" placeholder="请选择结束时间" />
              <wd-form-item title="条件类型" title-width="200rpx" prop="conditionType" center>
                <wd-radio-group v-model="formData.conditionType" type="button">
                  <wd-radio :value="10">
                    满金额
                  </wd-radio>
                  <wd-radio :value="20">
                    满件数
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <wd-form-item title="商品范围" title-width="200rpx" prop="productScope" center>
                <wd-radio-group v-model="formData.productScope" type="button">
                  <wd-radio :value="1">
                    全部
                  </wd-radio>
                  <wd-radio :value="2">
                    指定商品
                  </wd-radio>
                  <wd-radio :value="3">
                    指定分类
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <wd-form-item v-if="formData.productScope !== 1" :title="formData.productScope === 3 ? '指定分类' : '指定商品'" title-width="200rpx">
                <ScopePicker v-model="scopeValues" :scope="formData.productScope!" />
              </wd-form-item>
              <wd-form-item title="备注" title-width="200rpx">
                <wd-textarea v-model="formData.remark" clearable :maxlength="500" placeholder="请输入备注" />
              </wd-form-item>
            </wd-cell-group>
          </view>

          <!-- 优惠规则 -->
          <view class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-18rpx">
              <text class="text-30rpx text-[#333] font-semibold">优惠规则</text>
              <wd-button size="small" type="primary" variant="plain" @click="addRule">
                添加
              </wd-button>
            </view>
            <view v-for="(rule, index) in rules" :key="index" class="border-b border-[#f5f5f5] p-24rpx">
              <view class="mb-12rpx flex items-center justify-between">
                <text class="text-28rpx text-[#333]">规则 {{ index + 1 }}</text>
                <text class="text-26rpx text-[#fa4350]" @click="removeRule(index)">删除</text>
              </view>
              <view class="flex items-center gap-12rpx py-6rpx">
                <text class="w-180rpx shrink-0 text-26rpx text-[#666]">{{ formData.conditionType === 20 ? '满件数' : '满金额(元)' }}</text>
                <wd-input-number v-model="rule.limit" :min="0" :step="formData.conditionType === 20 ? 1 : 0.01" />
              </view>
              <view class="flex items-center gap-12rpx py-6rpx">
                <text class="w-180rpx shrink-0 text-26rpx text-[#666]">优惠金额(元)</text>
                <wd-input-number v-model="rule.discountPrice" :min="0" :step="0.01" />
              </view>
              <view class="flex items-center gap-12rpx py-6rpx">
                <text class="w-180rpx shrink-0 text-26rpx text-[#666]">赠送积分</text>
                <wd-input-number v-model="rule.point" :min="0" />
              </view>
              <view class="flex items-center gap-12rpx py-6rpx">
                <text class="w-180rpx shrink-0 text-26rpx text-[#666]">是否包邮</text>
                <wd-switch v-model="rule.freeDelivery" />
              </view>
            </view>
          </view>
        </view>
      </wd-form>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { PromotionRewardActivity } from '@/api/mall/promotion/reward'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionRewardActivity,
  getPromotionRewardActivity,
  updatePromotionRewardActivity,
} from '@/api/mall/promotion/reward'
import ScopePicker from '@/pages-mall/promotion/components/scope-picker.vue'
import { fenToYuan, yuanToFen } from '@/pages-mall/utils'
import { navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

interface RewardRuleForm { limit: number, discountPrice: number, point: number, freeDelivery: boolean }

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑满减送' : '新增满减送')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const scopeValues = ref<number[]>([]) // 指定商品/分类编号
const rules = ref<RewardRuleForm[]>([{ limit: 0, discountPrice: 0, point: 0, freeDelivery: false }]) // 优惠规则（金额为元）
const formData = ref<PromotionRewardActivity>({
  id: undefined,
  name: '',
  startTime: undefined,
  endTime: undefined,
  conditionType: 10,
  productScope: 1,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '活动名称不能为空' }],
  startTime: [{ required: true, message: '开始时间不能为空' }],
  endTime: [{ required: true, message: '结束时间不能为空' }],
})

/** 添加优惠规则 */
function addRule() {
  rules.value.push({ limit: 0, discountPrice: 0, point: 0, freeDelivery: false })
}

/** 删除优惠规则 */
function removeRule(index: number) {
  rules.value.splice(index, 1)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/reward-activity/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getPromotionRewardActivity(Number(props.id))
  formData.value = {
    id: data.id,
    name: data.name,
    startTime: data.startTime,
    endTime: data.endTime,
    conditionType: data.conditionType ?? 10,
    productScope: data.productScope ?? 1,
    remark: data.remark,
  }
  scopeValues.value = data.productScopeValues || []
  if (data.rules?.length) {
    // 满金额时 limit 为分，需转元；满件数时 limit 为整数
    rules.value = data.rules.map(rule => ({
      limit: data.conditionType === 20 ? (rule.limit ?? 0) : fenToYuan(rule.limit),
      discountPrice: fenToYuan(rule.discountPrice),
      point: rule.point ?? 0,
      freeDelivery: !!rule.freeDelivery,
    }))
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!rules.value.length) {
    toast.warning('请至少添加一条优惠规则')
    return
  }
  const isCount = formData.value.conditionType === 20
  const submitRules = rules.value.map(rule => ({
    limit: isCount ? Number(rule.limit) || 0 : yuanToFen(rule.limit),
    discountPrice: yuanToFen(rule.discountPrice),
    point: Number(rule.point) || 0,
    freeDelivery: !!rule.freeDelivery,
  }))
  const productScopeValues = formData.value.productScope === 1 ? [] : scopeValues.value
  formLoading.value = true
  try {
    const data: PromotionRewardActivity = {
      ...formData.value,
      productScopeValues,
      rules: submitRules,
    }
    if (props.id) {
      await updatePromotionRewardActivity(data)
      toast.success('修改成功')
    } else {
      await createPromotionRewardActivity(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-reward-activity:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
