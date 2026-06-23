<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="编辑公众号粉丝"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData">
        <wd-cell-group border>
          <wd-form-item title="昵称" title-width="180rpx" prop="nickname">
            <wd-input v-model="formData.nickname" clearable placeholder="请输入昵称" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx" prop="remark">
            <wd-input v-model="formData.remark" clearable placeholder="请输入备注" />
          </wd-form-item>
          <wd-form-item
            title="标签"
            title-width="180rpx"
            is-link
            :value="selectedTagLabel"
            placeholder="请选择标签"
            @click="tagPickerVisible = true"
          />
          <wd-select-picker
            v-model="formData.tagIds"
            v-model:visible="tagPickerVisible"
            title="请选择标签"
            :columns="tagList"
            :value-key="tagValueKey"
            label-key="name"
            type="checkbox"
            filterable
            @update:model-value="handleTagChange"
          />
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
import type { Tag } from '@/api/mp/tag'
import type { MpUser } from '@/api/mp/user'
import { onLoad } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getSimpleTagList } from '@/api/mp/tag'
import { getUser, updateUser } from '@/api/mp/user'
import { delay, navigateBackPlus } from '@/utils'
import { getMpRouteNumber, useMpRouteParams } from '../../utils/route'

const props = defineProps<{
  id?: number | any
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
const formLoading = ref(false) // 表单提交状态
const formData = ref<MpUser>({
  id: undefined,
  nickname: '',
  remark: '',
  tagIds: [],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const tagList = ref<Tag[]>([]) // 标签列表
const tagPickerVisible = ref(false) // 标签选择弹窗
const tagValueKey = 'tagId'

const selectedTagLabel = computed(() => {
  const tagIds = formData.value.tagIds || []
  if (tagIds.length === 0) {
    return ''
  }
  return tagIds
    .map(id => tagList.value.find(tag => tag.tagId === id)?.name)
    .filter(Boolean)
    .join('、')
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/user/index')
}

/** 加载详情 */
async function getDetail() {
  if (!id.value) {
    return
  }
  try {
    formData.value = await getUser(id.value)
    formData.value.tagIds = formData.value.tagIds || []
  } catch {
    // 请求层已提示错误，保留默认表单
  }
}

/** 标签变化 */
function handleTagChange(value: Array<boolean | number | string>) {
  formData.value.tagIds = value.map(Number)
}

/** 加载标签列表 */
async function loadTagList() {
  try {
    tagList.value = await getSimpleTagList()
  } catch {
    // 标签只是辅助展示，失败时保留已选编号
    tagList.value = []
  }
}

/** 提交表单 */
async function handleSubmit() {
  if (!id.value) {
    toast.show('缺少粉丝编号')
    return
  }
  formLoading.value = true
  try {
    await updateUser({
      id: id.value,
      nickname: formData.value.nickname,
      remark: formData.value.remark,
      tagIds: formData.value.tagIds,
    })
    toast.success('修改成功')
    uni.$emit('mp:user:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onLoad((query) => {
  syncRouteParams(query)
  loadTagList()
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
