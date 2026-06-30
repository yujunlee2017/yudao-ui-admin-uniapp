<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="仓库编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="仓库名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入仓库名称" clearable />
          </wd-form-item>
          <UserPicker
            v-model="formData.chargeUserId"
            label="负责人"
            label-width="220rpx"
            prop="chargeUserId"
            type="radio"
            placeholder="请选择负责人"
          />
          <wd-form-item title="仓库地址" title-width="220rpx" prop="address">
            <wd-textarea v-model="formData.address" placeholder="请输入仓库地址" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="面积(㎡)" title-width="220rpx" prop="area" center>
            <wd-input-number v-model="formData.area" :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="是否冻结" center>
            <view class="flex justify-end">
              <wd-switch v-model="formData.frozen" />
            </view>
          </wd-cell>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </scroll-view>
    <MesFooterActions>
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WmWarehouseCreateReqVO } from '@/api/mes/wm/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createWarehouse, getWarehouse, updateWarehouse } from '@/api/mes/wm/warehouse'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import UserPicker from '@/components/system-select/user-picker.vue'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const currentId = computed(() => props.id ? Number(props.id) : undefined)
const getTitle = computed(() => currentId.value ? '编辑仓库' : '新增仓库')
const formLoading = ref(false)
interface WmWarehouseFormData extends WmWarehouseCreateReqVO {
  id?: number
  address: string
  area: number
  chargeUserId?: number
  remark: string
}
const formData = ref<WmWarehouseFormData>(getDefaultFormData())

function getDefaultFormData(): WmWarehouseFormData {
  return {
    code: '',
    name: '',
    address: '',
    area: 0,
    chargeUserId: undefined,
    frozen: false,
    remark: '',
  }
}
const formSchema = createFormSchema({
  code: [{ required: true, message: '仓库编码不能为空' }],
  name: [{ required: true, message: '仓库名称不能为空' }],
})
const formRef = ref<FormInstance>()

function handleBack() {
  navigateBackPlus('/pages-mes/wm/warehouse/index')
}

async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getWarehouse(currentId.value)
  if (!data) {
    uni.showToast({ icon: 'none', title: '详情不存在，已返回列表' })
    delay(handleBack)
    return
  }
  formData.value = { id: data.id, code: data.code, name: data.name, address: data.address || '', area: Number(data.area ?? 0), chargeUserId: data.chargeUserId ?? undefined, frozen: data.frozen, remark: data.remark || '' }
}

async function loadPageData() {
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}

async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode('MD_WAREHOUSE_CODE')
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

async function handleSubmit() {
  if (!formRef.value)
    return
  const result = await formRef.value.validate()
  if (!result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data: WmWarehouseCreateReqVO = { code: formData.value.code, name: formData.value.name, address: formData.value.address || undefined, area: formData.value.area, chargeUserId: formData.value.chargeUserId, frozen: formData.value.frozen, remark: formData.value.remark || undefined }
    if (currentId.value) {
      await updateWarehouse({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createWarehouse(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:warehouse:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

onMounted(() => {
  loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
