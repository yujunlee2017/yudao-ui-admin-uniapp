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
          <wd-form-item title="门店名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入门店名称" />
          </wd-form-item>
          <wd-form-item title="联系电话" title-width="200rpx" prop="phone">
            <wd-input v-model="formData.phone" clearable placeholder="请输入联系电话" />
          </wd-form-item>
          <!-- TODO @AI：是不是不用 directory？看看其他地方也是，对齐 vue3 + ep 风格！ -->
          <wd-form-item title="门店 Logo" title-width="200rpx" prop="logo">
            <yd-upload-img v-model="formData.logo" directory="mall/pick-up-store" />
          </wd-form-item>
          <yd-tree-select v-model="formData.areaId" label="所在地区" prop="areaId" label-width="200rpx" :data="areaTree" placeholder="请选择所在地区" />
          <wd-form-item title="详细地址" title-width="200rpx" prop="detailAddress">
            <wd-textarea v-model="formData.detailAddress" clearable :maxlength="200" placeholder="请输入详细地址" />
          </wd-form-item>
          <wd-form-item title="营业开始" title-width="200rpx" prop="openingTime">
            <wd-input v-model="formData.openingTime" clearable placeholder="请输入营业开始时间" />
          </wd-form-item>
          <wd-form-item title="营业结束" title-width="200rpx" prop="closingTime">
            <wd-input v-model="formData.closingTime" clearable placeholder="请输入营业结束时间" />
          </wd-form-item>
          <!-- TODO @AI：可以把宽度拉大？如果可以，看看其他的 input-number 是不是也拉大？ -->
          <wd-form-item title="纬度" title-width="200rpx" prop="latitude" center>
            <wd-input-number v-model="formData.latitude" :min="-90" :max="90" :step="0.000001" :precision="6" allow-null />
          </wd-form-item>
          <!-- TODO @AI：可以把宽度拉大？如果可以，看看其他的 input-number 是不是也拉大？ -->
          <wd-form-item title="经度" title-width="200rpx" prop="longitude" center>
            <wd-input-number v-model="formData.longitude" :min="-180" :max="180" :step="0.000001" :precision="6" allow-null />
          </wd-form-item>
          <wd-form-item title="核销员编号" title-width="200rpx" prop="verifyUserIds">
            <wd-input v-model="formData.verifyUserIds" clearable placeholder="多个核销员编号用逗号分隔" />
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
          <wd-form-item title="简介" title-width="200rpx" prop="introduction">
            <wd-textarea v-model="formData.introduction" clearable :maxlength="500" placeholder="请输入简介" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DeliveryPickUpStore } from '@/api/mall/trade/delivery/pick-up-store'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createDeliveryPickUpStore,
  getDeliveryPickUpStore,
  updateDeliveryPickUpStore,
} from '@/api/mall/trade/delivery/pick-up-store'
import { getAreaTree } from '@/api/system/area'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

// TODO @AI：看看最新 vue3 + ep，是怎么处理这个场景哈；
// 表单内 verifyUserIds 以逗号分隔字符串编辑，提交时转换为 number[]
interface PickUpStoreFormData extends Omit<DeliveryPickUpStore, 'verifyUserIds'> {
  verifyUserIds?: string
}

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑自提门店' : '新增自提门店')
const formLoading = ref(false) // 表单提交状态
const areaTree = ref<any[]>([]) // 地区树数据
const formData = ref<PickUpStoreFormData>({
  id: undefined,
  name: '',
  phone: '',
  logo: '',
  areaId: undefined,
  detailAddress: '',
  openingTime: '09:00',
  closingTime: '18:00',
  latitude: undefined,
  longitude: undefined,
  verifyUserIds: '',
  status: CommonStatusEnum.ENABLE,
  introduction: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '门店名称不能为空' }],
  phone: [{ required: true, message: '联系电话不能为空' }],
  areaId: [{ required: true, message: '所在地区不能为空' }],
  detailAddress: [{ required: true, message: '详细地址不能为空' }],
  openingTime: [{ required: true, message: '营业开始时间不能为空' }],
  closingTime: [{ required: true, message: '营业结束时间不能为空' }],
  status: [{ required: true, message: '开启状态不能为空' }],
  latitude: [{ required: true, message: '纬度不能为空' }],
  longitude: [{ required: true, message: '经度不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/delivery/pick-up-store/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getDeliveryPickUpStore(Number(props.id))
  formData.value = {
    ...data,
    verifyUserIds: (data.verifyUserIds || []).join(','),
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data: DeliveryPickUpStore = {
      ...formData.value,
      // TODO @AI：是不是全局搞个工具类，专门处理类似的场景；（可通用）
      verifyUserIds: String(formData.value.verifyUserIds || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(Number),
    }
    if (props.id) {
      await updateDeliveryPickUpStore(data)
      toast.success('修改成功')
    } else {
      await createDeliveryPickUpStore(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:delivery-pick-up-store:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await Promise.all([
    getDetail(),
    getAreaTree().then((list) => {
      areaTree.value = list
    }),
  ])
})
</script>
