<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客户限制配置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 配置类型 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="拥有客户数限制" />
        <wd-tab title="锁定客户数限制" />
      </wd-tabs>
    </view>

    <!-- 配置列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无客户限制配置"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="text-32rpx text-[#333] font-semibold">
              {{ formatConfigTitle(item) }}
            </view>
            <wd-tag type="primary" variant="plain">
              上限 {{ item.maxCount || 0 }}
            </wd-tag>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="text-[#999]">适用人群：</text>{{ formatUserNames(item) }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="text-[#999]">适用部门：</text>{{ formatDeptNames(item) }}
          </view>
          <view
            v-if="item.type === LimitConfType.CUSTOMER_QUANTITY_LIMIT"
            class="mb-16rpx text-28rpx text-[#666]"
          >
            <text class="text-[#999]">成交占用：</text>{{ item.dealCountEnabled ? '是' : '否' }}
          </view>
          <view class="flex gap-16rpx">
            <wd-button size="small" type="primary" variant="plain" @click="handleEdit(item)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" :loading="deletingId === item.id" @click="handleDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />

    <!-- 表单弹窗 -->
    <!-- TODO @AI：类似这种，是不是拆个 form 会好点？如果是，看看 crm 里面其他有没类似的情况 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="max-h-[80vh] overflow-y-auto bg-white pb-32rpx">
        <view class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-24rpx">
          <view class="text-32rpx text-[#333] font-semibold">
            {{ formData.id ? '编辑配置' : '新增配置' }}
          </view>
          <wd-icon name="close" size="36rpx" @click="formVisible = false" />
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <UserPicker
              v-model="formData.userIds"
              type="checkbox"
              label="适用人群"
              prop="userIds"
              label-width="220rpx"
              placeholder="请选择适用人群"
            />
            <yd-tree-select
              v-model="formData.deptIds"
              label="适用部门"
              prop="deptIds"
              label-width="220rpx"
              multiple
              show-checkbox
              filterable
              show-toolbar
              :data="deptTree"
              placeholder="请选择适用部门"
            />
            <wd-form-item :title="maxCountLabel" title-width="220rpx" prop="maxCount">
              <wd-input
                v-model.number="formData.maxCount"
                type="number"
                clearable
                placeholder="请输入数量上限"
              />
            </wd-form-item>
            <wd-form-item
              v-if="formData.type === LimitConfType.CUSTOMER_QUANTITY_LIMIT"
              title="成交客户占用"
              title-width="220rpx"
              prop="dealCountEnabled"
              center
            >
              <wd-switch v-model="formData.dealCountEnabled" />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="p-24rpx">
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
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { CustomerLimitConfig } from '@/api/crm/customer/limitConfig'
import type { Dept } from '@/api/system/dept'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, ref } from 'vue'
import {
  createCustomerLimitConfig,
  deleteCustomerLimitConfig,
  getCustomerLimitConfig,
  getCustomerLimitConfigPage,
  LimitConfType,
  updateCustomerLimitConfig,
} from '@/api/crm/customer/limitConfig'
import { getSimpleDeptList } from '@/api/system/dept'
import UserPicker from '@/components/system-select/user-picker.vue'
import { navigateBackPlus } from '@/utils'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

interface CustomerLimitConfigForm extends Omit<CustomerLimitConfig, 'deptIds' | 'userIds'> {
  deptIds?: number[]
  userIds?: number[]
}

const dialog = useDialog()
const toast = useToast()
const tabIndex = ref(0) // 当前配置类型
const list = ref<CustomerLimitConfig[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const deletingId = ref<number>() // 删除状态
const formVisible = ref(false) // 表单弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const deptTree = ref<Dept[]>([]) // 部门树
const formData = ref<CustomerLimitConfigForm>({
  type: LimitConfType.CUSTOMER_QUANTITY_LIMIT,
  userIds: [],
  deptIds: [],
  dealCountEnabled: false,
}) // 表单数据
const activeType = computed(() => {
  return tabIndex.value === 0 ? LimitConfType.CUSTOMER_QUANTITY_LIMIT : LimitConfType.CUSTOMER_LOCK_LIMIT
})
const maxCountLabel = computed(() => {
  return activeType.value === LimitConfType.CUSTOMER_QUANTITY_LIMIT ? '拥有客户数上限' : '锁定客户数上限'
})
const formSchema = createFormSchema({
  maxCount: [{ required: true, message: '数量上限不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询配置列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getCustomerLimitConfigPage({
      pageNo,
      pageSize,
      type: activeType.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 切换配置类型 */
function handleTabChange() {
  nextTick(() => {
    pagingRef.value?.reload()
  })
}

/** 新增配置 */
function handleAdd() {
  formData.value = createDefaultData()
  formVisible.value = true
}

/** 编辑配置 */
async function handleEdit(item: CustomerLimitConfig) {
  if (!item.id) {
    return
  }
  formLoading.value = true
  formVisible.value = true
  try {
    const data = await getCustomerLimitConfig(item.id)
    formData.value = normalizeFormData(data)
  } finally {
    formLoading.value = false
  }
}

/** 删除配置 */
async function handleDelete(item: CustomerLimitConfig) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该客户限制配置吗？',
    })
  } catch {
    return
  }
  deletingId.value = item.id
  try {
    await deleteCustomerLimitConfig(item.id)
    toast.success('删除成功')
    pagingRef.value?.reload()
  } finally {
    deletingId.value = undefined
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
    const data = normalizeSubmitData(formData.value)
    if (data.id) {
      await updateCustomerLimitConfig(data)
      toast.success('修改成功')
    } else {
      await createCustomerLimitConfig(data)
      toast.success('新增成功')
    }
    formVisible.value = false
    pagingRef.value?.reload()
  } finally {
    formLoading.value = false
  }
}

/** 创建默认表单数据 */
function createDefaultData(): CustomerLimitConfigForm {
  return {
    type: activeType.value,
    userIds: [],
    deptIds: [],
    dealCountEnabled: false,
  }
}

/** 规范化表单数据 */
function normalizeFormData(data: CustomerLimitConfig): CustomerLimitConfigForm {
  return {
    ...createDefaultData(),
    ...data,
    userIds: normalizeIds(data.userIds),
    deptIds: normalizeIds(data.deptIds),
  }
}

/** 规范化提交数据 */
function normalizeSubmitData(data: CustomerLimitConfigForm): CustomerLimitConfig {
  return {
    ...data,
    type: activeType.value,
    userIds: normalizeIds(data.userIds),
    deptIds: normalizeIds(data.deptIds),
  }
}

/** 解析编号数组 */
function normalizeIds(value: CustomerLimitConfig['deptIds'] | CustomerLimitConfig['userIds']) {
  if (Array.isArray(value)) {
    return value
  }
  if (!value) {
    return []
  }
  return String(value).split(',').filter(Boolean).map(Number)
}

/** 格式化配置标题 */
function formatConfigTitle(item: CustomerLimitConfig) {
  return item.type === LimitConfType.CUSTOMER_QUANTITY_LIMIT ? '拥有客户数限制' : '锁定客户数限制'
}

/** 格式化适用人群（昵称，回退「全部」） */
function formatUserNames(item: CustomerLimitConfig) {
  const names = (item.users || []).map(user => user.nickname).filter(Boolean)
  return names.length > 0 ? names.join('、') : '全部'
}

/** 格式化适用部门（名称，回退「全部」） */
function formatDeptNames(item: CustomerLimitConfig) {
  const names = (item.depts || []).map(dept => dept.name).filter(Boolean)
  return names.length > 0 ? names.join('、') : '全部'
}

/** 初始化 */
onMounted(async () => {
  deptTree.value = handleTree(await getSimpleDeptList())
})
</script>
