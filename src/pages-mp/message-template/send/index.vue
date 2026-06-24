<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="发送模板消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="模板标题" :value="templateTitle || '-'" />
          <wd-form-item
            title="用户"
            title-width="220rpx"
            prop="userId"
            is-link
            :value="selectedUserLabel"
            placeholder="请选择用户"
            @click="userPickerVisible = true"
          />
          <wd-select-picker
            v-model="formData.userId"
            v-model:visible="userPickerVisible"
            title="请选择用户"
            :columns="userList"
            value-key="id"
            label-key="nickname"
            type="radio"
            filterable
            @confirm="handleUserConfirm"
          />
          <wd-form-item title="模板数据" title-width="220rpx" prop="data">
            <wd-textarea
              v-model="formData.data"
              placeholder="请输入 JSON，例如：{&quot;keyword1&quot;:{&quot;value&quot;:&quot;测试内容&quot;}}"
              :maxlength="2000"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <wd-form-item title="跳转链接" title-width="220rpx" prop="url">
            <wd-input v-model="formData.url" clearable placeholder="请输入跳转链接" />
          </wd-form-item>
          <wd-form-item title="小程序 AppID" title-width="220rpx" prop="miniProgramAppId">
            <wd-input v-model="formData.miniProgramAppId" clearable placeholder="请输入小程序 AppID" />
          </wd-form-item>
          <wd-form-item title="页面路径" title-width="220rpx" prop="miniProgramPagePath">
            <wd-input v-model="formData.miniProgramPagePath" clearable placeholder="请输入小程序页面路径" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部发送按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="loading" @click="handleSubmit">
        发送
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MsgTemplateSend } from '@/api/mp/messageTemplate'
import type { MpUser } from '@/api/mp/user'
import { onLoad } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { sendMessageTemplate } from '@/api/mp/messageTemplate'
import { getUserPage } from '@/api/mp/user'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import { getMpRouteNumber, getMpRouteString, useMpRouteParams } from '../../utils/route'

const props = defineProps<{
  id?: number | any
  accountId?: number | any
  title?: string
}>()
const { routeParams, syncRouteParams } = useMpRouteParams(props)

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const id = computed(() => getMpRouteNumber(routeParams.id))
const accountId = computed(() => getMpRouteNumber(routeParams.accountId))
const templateTitle = computed(() => {
  const title = getMpRouteString(routeParams.title)
  try {
    return decodeURIComponent(title)
  } catch {
    return title
  }
})
const loading = ref(false) // 发送状态
const userPickerVisible = ref(false) // 用户选择弹窗
const userList = ref<MpUser[]>([]) // 用户列表
const formData = ref<MsgTemplateSend>({
  id: id.value,
  userId: undefined!,
  data: '',
  url: '',
  miniProgramAppId: '',
  miniProgramPagePath: '',
}) // 表单数据
const formSchema = createFormSchema({
  userId: [{ required: true, message: '用户不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

const selectedUserLabel = computed(() => {
  const user = userList.value.find(item => item.id === formData.value.userId)
  return user?.nickname || user?.openid || ''
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/message-template/index')
}

/** 加载用户列表 */
async function loadUserList() {
  if (!accountId.value) {
    return
  }
  try {
    const data = await getUserPage({
      pageNo: 1,
      pageSize: 50,
      accountId: accountId.value,
    })
    userList.value = data.list.map(item => ({
      ...item,
      nickname: item.nickname || item.openid,
    }))
  } catch {
    userList.value = []
  }
}

/** 用户选择 */
function handleUserConfirm({ value }: { value: number | string }) {
  formData.value.userId = Number(value)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!id.value) {
    toast.show('缺少模板编号')
    return
  }

  const data: MsgTemplateSend = { ...formData.value, id: id.value }
  if (data.data) {
    try {
      data.data = JSON.parse(String(data.data))
    } catch {
      toast.show('模板数据不是有效 JSON')
      return
    }
  }
  if (data.miniProgramAppId && data.miniProgramPagePath) {
    data.miniprogram = JSON.stringify({
      appid: data.miniProgramAppId,
      pagepath: data.miniProgramPagePath,
    })
  }

  loading.value = true
  try {
    await sendMessageTemplate(data)
    toast.success('发送成功')
    delay(handleBack)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onLoad((query) => {
  syncRouteParams(query)
  formData.value.id = id.value
  loadUserList()
})
</script>

<style lang="scss" scoped>
</style>
