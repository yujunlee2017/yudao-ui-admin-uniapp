<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="时段名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入时段名称" />
          </wd-form-item>
          <wd-form-item title="开始时间" title-width="200rpx" prop="startTime">
            <wd-input v-model="formData.startTime" clearable placeholder="HH:mm，例如 09:00" />
          </wd-form-item>
          <wd-form-item title="结束时间" title-width="200rpx" prop="endTime">
            <wd-input v-model="formData.endTime" clearable placeholder="HH:mm，例如 12:00" />
          </wd-form-item>
          <wd-form-item title="轮播图" title-width="200rpx" prop="sliderPicUrls">
            <wd-textarea v-model="sliderPicText" clearable placeholder="多个图片 URL 用英文逗号分隔" />
          </wd-form-item>
          <wd-form-item title="开启状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

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
import type { PromotionSeckillConfig } from '@/api/mall/promotion/seckill'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionSeckillConfig,
  getPromotionSeckillConfig,
  updatePromotionSeckillConfig,
} from '@/api/mall/promotion/seckill'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑秒杀时段' : '新增秒杀时段')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const sliderPicText = ref('') // 轮播图 URL 文本（逗号分隔）
const formData = ref<PromotionSeckillConfig>({
  id: undefined,
  name: '',
  startTime: '00:00',
  endTime: '01:00',
  sliderPicUrls: [],
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '时段名称不能为空' }],
  startTime: [{ required: true, message: '开始时间不能为空' }],
  endTime: [{ required: true, message: '结束时间不能为空' }],
  status: [{ required: true, message: '开启状态不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/seckill-config/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getPromotionSeckillConfig(Number(props.id))
  formData.value = data
  sliderPicText.value = (data.sliderPicUrls || []).join(',')
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const data: PromotionSeckillConfig = {
      ...formData.value,
      sliderPicUrls: sliderPicText.value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean),
    }
    if (props.id) {
      await updatePromotionSeckillConfig(data)
      toast.success('修改成功')
    } else {
      await createPromotionSeckillConfig(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-seckill-config:reload')
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
