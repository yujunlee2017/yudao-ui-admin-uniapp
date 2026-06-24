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
          <wd-form-item title="渠道编码" title-width="220rpx">
            <wd-input v-model="formData.code" disabled />
          </wd-form-item>
          <wd-form-item title="渠道费率" title-width="220rpx" prop="feeRate" center>
            <wd-input-number v-model="formData.feeRate" :min="0" :step="0.01" />
            <text class="ml-12rpx text-26rpx text-[#999]">%</text>
          </wd-form-item>
          <wd-form-item title="渠道状态" title-width="220rpx" prop="status" center>
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
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              auto-height
              clearable
              placeholder="请输入备注"
            />
          </wd-form-item>
          <!-- TODO @AI：目前直接展示 json 不好，参考下 vue3 + ep 的做法！ -->
          <wd-form-item title="渠道配置" title-width="220rpx" prop="configText">
            <wd-textarea
              v-model="formData.configText"
              auto-height
              clearable
              placeholder="请输入 JSON 配置"
            />
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
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPayChannel,
  getPayChannel,
  updatePayChannel,
} from '@/api/pay/channel'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, PayChannelEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  appId?: number | any
  code?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
// TODO @AI：这里的 formData.value.id 报“ESLint: 'formData' was used before it was defined. (ts/no-use-before-define)”错。
const getTitle = computed(() => formData.value.id ? '编辑支付渠道' : '新增支付渠道')
const formRef = ref<FormInstance>() // 表单组件引用
const formLoading = ref(false) // 表单提交状态
const formData = ref({
  id: undefined as number | undefined,
  appId: undefined as number | undefined,
  code: '',
  status: CommonStatusEnum.ENABLE,
  feeRate: 0,
  remark: '',
  configText: '',
}) // 表单数据
const formSchema = createFormSchema({
  feeRate: [{ required: true, message: '渠道费率不能为空' }],
  status: [{ required: true, message: '渠道状态不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-pay/app/channel/index?appId=${props.appId || ''}`)
}

/** 默认渠道配置 */
function getDefaultConfig(code?: string) {
  if (code === PayChannelEnum.WALLET.code) {
    return { name: 'wallet-conf' }
  }
  if (code === PayChannelEnum.MOCK.code) {
    return { name: 'mock-conf' }
  }
  if (code?.startsWith('alipay_')) {
    return {
      appId: '',
      serverUrl: 'https://openapi.alipay.com/gateway.do',
      signType: 'RSA2',
      mode: 1,
      privateKey: '',
      alipayPublicKey: '',
      appCertContent: '',
      alipayPublicCertContent: '',
      rootCertContent: '',
      encryptType: '',
      encryptKey: '',
    }
  }
  if (code?.startsWith('wx_')) {
    return {
      appId: '',
      mchId: '',
      apiVersion: 'v3',
      mchKey: '',
      keyContent: '',
      privateKeyContent: '',
      certSerialNo: '',
      apiV3Key: '',
      publicKeyContent: '',
      publicKeyId: '',
    }
  }
  return {}
}

/** JSON 格式化 */
function stringifyConfig(config: any) {
  try {
    return JSON.stringify(typeof config === 'string' ? JSON.parse(config || '{}') : config, null, 2)
  } catch {
    return config || '{}'
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.appId || !props.code) {
    return
  }
  // TODO @AI：是不是不用这样默认值，直接后端加载？类似别的界面一样。
  formData.value = {
    id: undefined,
    appId: Number(props.appId),
    code: props.code,
    status: CommonStatusEnum.ENABLE,
    feeRate: 0,
    remark: '',
    configText: stringifyConfig(getDefaultConfig(props.code)),
  }
  formLoading.value = true
  try {
    const data = await getPayChannel(Number(props.appId), props.code)
    if (!data?.id) {
      return
    }
    formData.value = {
      id: data.id,
      appId: data.appId,
      code: data.code || props.code,
      status: data.status ?? CommonStatusEnum.ENABLE,
      feeRate: data.feeRate ?? 0,
      remark: data.remark || '',
      configText: stringifyConfig(data.config || getDefaultConfig(props.code)),
    }
  } catch {
    // 保持默认新增表单
  } finally {
    formLoading.value = false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  let config = ''
  try {
    config = JSON.stringify(JSON.parse(formData.value.configText || '{}'))
  } catch {
    toast.error('渠道配置必须是合法 JSON')
    return
  }

  formLoading.value = true
  try {
    const data = {
      id: formData.value.id,
      appId: Number(props.appId),
      code: props.code,
      status: formData.value.status,
      feeRate: formData.value.feeRate,
      remark: formData.value.remark,
      config,
    }
    if (formData.value.id) {
      await updatePayChannel(data)
      toast.success('修改成功')
    } else {
      await createPayChannel(data)
      toast.success('新增成功')
    }
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
