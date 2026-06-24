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
        <wd-cell-group border title="请求配置">
          <template v-if="formData.type === AutoReplyType.Message">
            <wd-form-item
              title="消息类型"
              title-width="220rpx"
              prop="requestMessageType"
              is-link
              :value="getWotPickerFormValue(requestMessageOptions, formData.requestMessageType)"
              placeholder="请选择消息类型"
              @click="pickerVisible.requestMessageType = true"
            />
            <wd-picker
              v-model:visible="pickerVisible.requestMessageType"
              :model-value="[formData.requestMessageType]"
              :columns="requestMessageOptions"
              @confirm="({ value }) => formData.requestMessageType = value[0]"
            />
          </template>
          <template v-if="formData.type === AutoReplyType.Keyword">
            <wd-form-item title="关键词" title-width="220rpx" prop="requestKeyword">
              <wd-input v-model="formData.requestKeyword" clearable placeholder="请输入关键词" />
            </wd-form-item>
            <wd-form-item
              title="匹配类型"
              title-width="220rpx"
              prop="requestMatch"
              is-link
              :value="getWotPickerFormValue(getIntDictOptions(DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH), formData.requestMatch)"
              placeholder="请选择匹配类型"
              @click="pickerVisible.requestMatch = true"
            />
            <wd-picker
              v-model:visible="pickerVisible.requestMatch"
              :model-value="[formData.requestMatch]"
              :columns="getIntDictOptions(DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH)"
              @confirm="({ value }) => formData.requestMatch = value[0]"
            />
          </template>
        </wd-cell-group>

        <wd-cell-group border title="回复配置">
          <wd-form-item
            title="回复类型"
            title-width="220rpx"
            prop="responseMessageType"
            is-link
            :value="getWotPickerFormValue(responseMessageOptions, formData.responseMessageType)"
            placeholder="请选择回复类型"
            @click="pickerVisible.responseMessageType = true"
          />
          <wd-picker
            v-model:visible="pickerVisible.responseMessageType"
            :model-value="[formData.responseMessageType]"
            :columns="responseMessageOptions"
            @confirm="({ value }) => formData.responseMessageType = value[0]"
          />
          <wd-form-item v-if="formData.responseMessageType === 'text'" title="回复内容" title-width="220rpx" prop="responseContent">
            <wd-textarea v-model="formData.responseContent" clearable placeholder="请输入回复内容" />
          </wd-form-item>
          <template v-else>
            <wd-cell
              v-if="canPickMaterial"
              title="素材库"
              is-link
              :value="formData.responseMessageType === 'music' ? '选择缩略图' : '选择素材'"
              @click="materialPickerVisible = true"
            />
            <!-- 图片：上传到素材库 + 预览 -->
            <wd-cell
              v-if="formData.responseMessageType === 'image'"
              title="上传图片"
              is-link
              value="从相册选择并上传"
              @click="handleUploadImage"
            />
            <view v-if="formData.responseMessageType === 'image' && formData.responseMediaUrl" class="px-24rpx py-16rpx">
              <wd-img :src="formData.responseMediaUrl" width="200rpx" height="200rpx" mode="aspectFill" radius="8rpx" />
            </view>
            <!-- 图片/语音/视频：素材媒体；音乐不使用 responseMediaId/Url -->
            <template v-if="formData.responseMessageType !== 'music'">
              <wd-form-item title="素材 MediaID" title-width="220rpx" prop="responseMediaId">
                <wd-input v-model="formData.responseMediaId" clearable placeholder="请输入素材 MediaID" />
              </wd-form-item>
              <wd-form-item title="素材 URL" title-width="220rpx" prop="responseMediaUrl">
                <wd-input v-model="formData.responseMediaUrl" clearable placeholder="请输入素材 URL" />
              </wd-form-item>
            </template>
            <!-- 音乐：缩略图（选图片素材回填）+ 音乐链接 -->
            <template v-if="formData.responseMessageType === 'music'">
              <wd-form-item title="缩略图 MediaID" title-width="220rpx" prop="responseThumbMediaId">
                <wd-input v-model="formData.responseThumbMediaId" clearable placeholder="请选择图片素材作为缩略图" />
              </wd-form-item>
              <wd-form-item title="缩略图 URL" title-width="220rpx" prop="responseThumbMediaUrl">
                <wd-input v-model="formData.responseThumbMediaUrl" clearable placeholder="请选择图片素材作为缩略图" />
              </wd-form-item>
              <wd-form-item title="音乐链接" title-width="220rpx" prop="responseMusicUrl">
                <wd-input v-model="formData.responseMusicUrl" clearable placeholder="请输入音乐链接" />
              </wd-form-item>
              <wd-form-item title="高质量链接" title-width="220rpx" prop="responseHqMusicUrl">
                <wd-input v-model="formData.responseHqMusicUrl" clearable placeholder="请输入高质量音乐链接" />
              </wd-form-item>
            </template>
            <wd-form-item title="标题" title-width="220rpx" prop="responseTitle">
              <wd-input v-model="formData.responseTitle" clearable placeholder="请输入标题" />
            </wd-form-item>
            <wd-form-item title="描述" title-width="220rpx" prop="responseDescription">
              <wd-textarea v-model="formData.responseDescription" clearable placeholder="请输入描述" />
            </wd-form-item>
            <wd-form-item v-if="formData.responseMessageType === 'news'" title="图文 JSON" title-width="220rpx" prop="responseArticlesText">
              <wd-textarea v-model="responseArticlesText" clearable placeholder="请输入图文数组 JSON" />
            </wd-form-item>
            <view v-if="formData.responseMessageType === 'news' && formData.responseArticles?.length" class="px-24rpx pb-16rpx">
              <NewsCard :articles="formData.responseArticles" />
            </view>
          </template>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 素材选择 -->
    <MaterialPicker
      v-model:visible="materialPickerVisible"
      :account-id="formData.accountId"
      :type="materialPickerType"
      @select="handleMaterialSelect"
    />

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
import type { AutoReply } from '@/api/mp/autoReply'
import { onLoad } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { AutoReplyType, createAutoReply, getAutoReply, updateAutoReply } from '@/api/mp/autoReply'
import { uploadPermanentMaterial } from '@/api/mp/material'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MpAutoReplyRequestMatchEnum } from '@/utils/constants'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import MaterialPicker from '@/pages-mp/material/components/material-picker.vue'
import NewsCard from '../../components/news-card.vue'
import { getMpRouteNumber, useMpRouteParams } from '../../utils/route'

const props = defineProps<{
  id?: number | any
  accountId?: number | any
  type?: number | any
}>()
const { routeParams, syncRouteParams } = useMpRouteParams(props)

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const requestMessageTypes = ['text', 'image', 'voice', 'video', 'shortvideo', 'location', 'link']
const toast = useToast()
const id = computed(() => getMpRouteNumber(routeParams.id))
const accountId = computed(() => getMpRouteNumber(routeParams.accountId))
const replyType = computed(() => getMpRouteNumber(routeParams.type) || AutoReplyType.Keyword)
const getTitle = computed(() => id.value ? '编辑自动回复' : '新增自动回复')
const formLoading = ref(false) // 表单提交状态
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const materialPickerVisible = ref(false) // 素材选择弹窗
const uploading = ref(false) // 图片上传状态
const responseArticlesText = ref('') // 图文 JSON
const formData = ref<AutoReply>({
  id: undefined,
  accountId: accountId.value || 0,
  type: replyType.value,
  requestKeyword: undefined,
  requestMatch: replyType.value === AutoReplyType.Keyword ? MpAutoReplyRequestMatchEnum.ALL : undefined,
  requestMessageType: undefined,
  responseMessageType: 'text',
  responseContent: '',
}) // 表单数据
const formSchema = createFormSchema({
  requestKeyword: [{ required: () => formData.value.type === AutoReplyType.Keyword, message: '关键词不能为空' }],
  requestMatch: [{ required: () => formData.value.type === AutoReplyType.Keyword, message: '匹配类型不能为空' }],
  requestMessageType: [{ required: () => formData.value.type === AutoReplyType.Message, message: '消息类型不能为空' }],
  responseMessageType: [{ required: true, message: '回复类型不能为空' }],
  responseContent: [{ required: () => formData.value.responseMessageType === 'text', message: '回复内容不能为空' }],
  responseMediaId: [{ required: () => ['image', 'voice', 'video'].includes(String(formData.value.responseMessageType)), message: '素材 MediaID 不能为空' }],
  responseMediaUrl: [{ required: () => ['image', 'voice', 'video'].includes(String(formData.value.responseMessageType)), message: '素材 URL 不能为空' }],
  responseTitle: [{ required: () => formData.value.responseMessageType === 'video', message: '视频标题不能为空' }],
  responseDescription: [{ required: () => formData.value.responseMessageType === 'video', message: '视频描述不能为空' }],
  responseThumbMediaId: [{ required: () => formData.value.responseMessageType === 'music', message: '请选择音乐缩略图' }],
  responseThumbMediaUrl: [{ required: () => formData.value.responseMessageType === 'music', message: '请选择音乐缩略图' }],
  responseMusicUrl: [{ required: () => formData.value.responseMessageType === 'music', message: '音乐链接不能为空' }],
  responseHqMusicUrl: [{ required: () => formData.value.responseMessageType === 'music', message: '高质量音乐链接不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

const requestMessageOptions = computed(() => getStrDictOptions(DICT_TYPE.MP_MESSAGE_TYPE).filter(item => requestMessageTypes.includes(String(item.value))))
const responseMessageOptions = computed(() => getStrDictOptions(DICT_TYPE.MP_MESSAGE_TYPE).filter(item => ['text', 'image', 'voice', 'video', 'news', 'music'].includes(String(item.value))))
const canPickMaterial = computed(() => ['image', 'voice', 'video', 'news', 'music'].includes(String(formData.value.responseMessageType)))
const materialPickerType = computed<'image' | 'voice' | 'video' | 'news'>(() => {
  const type = formData.value.responseMessageType
  return type === 'voice' || type === 'video' || type === 'news' ? type : 'image'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/auto-reply/index')
}

/** 加载详情 */
async function getDetail() {
  if (!id.value) {
    return
  }
  formData.value = await getAutoReply(id.value)
  responseArticlesText.value = formData.value.responseArticles ? JSON.stringify(formData.value.responseArticles) : ''
}

/** 上传图片到素材库并回填 MediaID / URL */
function handleUploadImage() {
  if (uploading.value) {
    return
  }
  if (!formData.value.accountId) {
    toast.show('请先选择公众号')
    return
  }
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const path = res.tempFilePaths?.[0]
      if (!path) {
        return
      }
      uploading.value = true
      toast.loading('上传中...')
      try {
        const material = await uploadPermanentMaterial(path, { accountId: formData.value.accountId!, type: 'image' })
        formData.value.responseMediaId = material.mediaId || ''
        formData.value.responseMediaUrl = material.url || ''
        toast.success('上传成功')
      } catch {
        toast.close()
      } finally {
        uploading.value = false
      }
    },
  })
}

/** 选择素材 */
function handleMaterialSelect(item: any) {
  if (formData.value.responseMessageType === 'news') {
    const articles = item.content?.newsItem || item.articles || []
    formData.value.responseArticles = articles
    responseArticlesText.value = JSON.stringify(articles)
    return
  }
  // 音乐：选图片素材作为缩略图
  if (formData.value.responseMessageType === 'music') {
    formData.value.responseThumbMediaId = item.mediaId || ''
    formData.value.responseThumbMediaUrl = item.url || ''
    return
  }
  formData.value.responseMediaId = item.mediaId || ''
  formData.value.responseMediaUrl = item.url || ''
  formData.value.responseTitle = item.title || item.name || ''
  formData.value.responseDescription = item.introduction || item.description || ''
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const data: AutoReply = { ...formData.value }
  if (data.responseMessageType === 'news') {
    if (!responseArticlesText.value) {
      toast.show('请选择图文素材')
      return
    }
    let articles: any[]
    try {
      articles = JSON.parse(responseArticlesText.value)
    } catch {
      toast.show('图文 JSON 格式不正确')
      return
    }
    if (!Array.isArray(articles) || articles.length === 0) {
      toast.show('请选择图文素材')
      return
    }
    data.responseArticles = articles
  }
  data.id = id.value || data.id
  data.accountId = data.accountId || accountId.value || 0
  data.type = data.type || replyType.value

  formLoading.value = true
  try {
    if (id.value) {
      await updateAutoReply(data)
      toast.success('修改成功')
    } else {
      await createAutoReply(data)
      toast.success('新增成功')
    }
    uni.$emit('mp:auto-reply:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onLoad((query) => {
  syncRouteParams(query)
  if (!id.value) {
    formData.value.accountId = accountId.value || 0
    formData.value.type = replyType.value
    formData.value.requestMatch = replyType.value === AutoReplyType.Keyword ? MpAutoReplyRequestMatchEnum.ALL : undefined
  }
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
