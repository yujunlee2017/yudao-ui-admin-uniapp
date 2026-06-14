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
          <wd-form-item title="客户名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入客户名称" clearable />
          </wd-form-item>
          <wd-form-item title="客户来源" title-width="200rpx" prop="source" is-link placeholder="请选择客户来源" :value="getDictLabel(DICT_TYPE.CRM_CUSTOMER_SOURCE, formData.source)" @click="pickerVisible.source = true" />
          <wd-picker v-model:visible="pickerVisible.source" :model-value="formData.source" :columns="getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE)" label-key="label" value-key="value" @confirm="({ value }) => formData.source = value[0]" />
          <wd-form-item title="手机" title-width="200rpx" prop="mobile">
            <wd-input v-model="formData.mobile" placeholder="请输入手机" clearable />
          </wd-form-item>
          <UserPicker v-model="formData.ownerUserId" type="radio" label="负责人" prop="ownerUserId" :disabled="!!props.id" placeholder="请选择负责人" />
          <wd-form-item title="电话" title-width="200rpx" prop="telephone">
            <wd-input v-model="formData.telephone" placeholder="请输入电话" clearable />
          </wd-form-item>
          <wd-form-item title="邮箱" title-width="200rpx" prop="email">
            <wd-input v-model="formData.email" placeholder="请输入邮箱" clearable />
          </wd-form-item>
          <wd-form-item title="微信" title-width="200rpx" prop="wechat">
            <wd-input v-model="formData.wechat" placeholder="请输入微信" clearable />
          </wd-form-item>
          <wd-form-item title="QQ" title-width="200rpx" prop="qq">
            <wd-input v-model="formData.qq" placeholder="请输入 QQ" clearable />
          </wd-form-item>
          <wd-form-item title="客户行业" title-width="200rpx" prop="industryId" is-link placeholder="请选择客户行业" :value="getDictLabel(DICT_TYPE.CRM_CUSTOMER_INDUSTRY, formData.industryId)" @click="pickerVisible.industryId = true" />
          <wd-picker v-model:visible="pickerVisible.industryId" :model-value="formData.industryId" :columns="getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY)" label-key="label" value-key="value" @confirm="({ value }) => formData.industryId = value[0]" />
          <wd-form-item title="客户级别" title-width="200rpx" prop="level" is-link placeholder="请选择客户级别" :value="getDictLabel(DICT_TYPE.CRM_CUSTOMER_LEVEL, formData.level)" @click="pickerVisible.level = true" />
          <wd-picker v-model:visible="pickerVisible.level" :model-value="formData.level" :columns="getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL)" label-key="label" value-key="value" @confirm="({ value }) => formData.level = value[0]" />
          <YdTreeSelect v-model="formData.areaId" :data="areaTree" label="地区" prop="areaId" label-width="200rpx" placeholder="请选择地区" />
          <wd-form-item title="详细地址" title-width="200rpx" prop="detailAddress">
            <wd-input v-model="formData.detailAddress" placeholder="请输入详细地址" clearable />
          </wd-form-item>
          <wd-form-item title="下次联系时间" title-width="200rpx" prop="contactNextTime" is-link placeholder="请选择下次联系时间" :value="formatDateTime(formData.contactNextTime)" @click="pickerVisible.contactNextTime = true" />
          <wd-datetime-picker v-model="formData.contactNextTime" v-model:visible="pickerVisible.contactNextTime" title="请选择下次联系时间" type="datetime" />
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
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
import type { Customer } from '@/api/crm/customer'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createCustomer, getCustomer, updateCustomer } from '@/api/crm/customer'
import { getAreaTree } from '@/api/system/area'
import UserPicker from '@/components/system-select/user-picker.vue'
import YdTreeSelect from '@/components/yudao-ui/yd-tree-select/yd-tree-select.vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const userStore = useUserStore()
const getTitle = computed(() => props.id ? '编辑客户' : '新增客户')
const formLoading = ref(false) // 表单提交状态
// TODO @AI：formData 参考下别的 form 组件；user form
const formData = ref<Customer>({ name: '', ownerUserId: undefined, lockStatus: false, dealStatus: false }) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const areaTree = ref<any[]>([]) // 地区树数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '客户名称不能为空' }],
  ownerUserId: [{ required: true, message: '负责人不能为空' }],
  mobile: [{ type: 'mobile', message: '请输入正确的手机' }],
  email: [{ type: 'email', message: '请输入正确的邮箱' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/customer/index')
}

/** 加载客户详情 */
async function getDetail() {
  if (!props.id) {
    // 新增时默认负责人为当前登录用户
    const userId = userStore.userInfo?.userId
    if (userId && userId !== -1) {
      formData.value.ownerUserId = userId
    }
    return
  }
  formData.value = await getCustomer(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateCustomer(formData.value)
      toast.success('修改成功')
    } else {
      await createCustomer(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('crm:customer:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  areaTree.value = await getAreaTree()
  // TODO @AI：需要 await？看看别的模块，是不是也有类似问题！
  getDetail()
})
</script>
