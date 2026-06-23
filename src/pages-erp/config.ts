import { getSimpleUserList } from '@/api/system/user'
import * as AccountApi from '@/api/erp/finance/account'
import * as FinancePaymentApi from '@/api/erp/finance/payment'
import * as FinanceReceiptApi from '@/api/erp/finance/receipt'
import * as ProductCategoryApi from '@/api/erp/product/category'
import * as ProductApi from '@/api/erp/product/product'
import * as ProductUnitApi from '@/api/erp/product/unit'
import * as PurchaseInApi from '@/api/erp/purchase/in'
import * as PurchaseOrderApi from '@/api/erp/purchase/order'
import * as PurchaseReturnApi from '@/api/erp/purchase/return'
import * as SupplierApi from '@/api/erp/purchase/supplier'
import * as CustomerApi from '@/api/erp/sale/customer'
import * as SaleOrderApi from '@/api/erp/sale/order'
import * as SaleOutApi from '@/api/erp/sale/out'
import * as SaleReturnApi from '@/api/erp/sale/return'
import * as StockCheckApi from '@/api/erp/stock/check'
import * as StockInApi from '@/api/erp/stock/in'
import * as StockMoveApi from '@/api/erp/stock/move'
import * as StockOutApi from '@/api/erp/stock/out'
import * as StockRecordApi from '@/api/erp/stock/record'
import * as StockApi from '@/api/erp/stock/stock'
import * as WarehouseApi from '@/api/erp/stock/warehouse'
import * as PurchaseStatisticsApi from '@/api/erp/statistics/purchase'
import * as SaleStatisticsApi from '@/api/erp/statistics/sale'

export type ErpFieldType = 'audit-status' | 'boolean' | 'date' | 'dict' | 'file' | 'items' | 'money' | 'number' | 'picker' | 'status' | 'textarea' | 'text'
export type ErpOptionKey = 'account' | 'category' | 'customer' | 'product' | 'supplier' | 'unit' | 'user' | 'warehouse'

export interface ErpField {
  prop: string // 字段名
  label: string // 展示名称
  type?: ErpFieldType // 字段类型
  required?: boolean // 是否必填
  searchable?: boolean // 是否支持搜索
  hiddenInForm?: boolean // 表单隐藏
  hiddenInList?: boolean // 列表隐藏
  hiddenInDetail?: boolean // 详情隐藏
  hiddenWhenEmpty?: boolean // 空值隐藏
  readonly?: boolean // 只读字段
  optionsKey?: ErpOptionKey // 选择器数据源
  labelField?: string // 后端返回的名称字段
  dictType?: string // 字典类型
}

export interface ErpModule {
  key: string // 模块唯一标识
  group: string // 所属分组
  title: string // 模块名称
  icon: string // 工作台图标
  iconColor: string // 图标颜色
  permission: string // 权限前缀
  route?: string // 精迁页面路径
  exportConfig?: { url: string, fileName: string } // 导出配置
  listMode: 'list' | 'page' // 列表模式
  readonly?: boolean // 只读模块
  fields: ErpField[] // 字段配置
  itemFields?: ErpField[] // 明细字段配置
  operations: {
    page?: (params: Record<string, any>) => Promise<any>
    list?: (params?: Record<string, any>) => Promise<any[]>
    get: (id: number) => Promise<Record<string, any>>
    create?: (data: Record<string, any>) => Promise<any>
    update?: (data: Record<string, any>) => Promise<any>
    delete?: (id: number) => Promise<any>
    updateStatus?: (id: number, status: number) => Promise<any>
    updateDefaultStatus?: (id: number, defaultStatus: boolean) => Promise<any>
  }
}

export const ERP_AUDIT_STATUS = 'erp_audit_status'
export const ERP_STOCK_RECORD_BIZ_TYPE = 'erp_stock_record_biz_type'

export const erpGroups = [
  { key: 'product', name: '产品管理' },
  { key: 'purchase', name: '采购管理' },
  { key: 'sale', name: '销售管理' },
  { key: 'stock', name: '库存管理' },
  { key: 'finance', name: '财务管理' },
] as const

const contactFields: ErpField[] = [
  { prop: 'name', label: '名称', searchable: true, required: true },
  { prop: 'contact', label: '联系人', searchable: true },
  { prop: 'mobile', label: '手机号码', searchable: true },
  { prop: 'telephone', label: '联系电话' },
  { prop: 'email', label: '电子邮箱' },
  { prop: 'fax', label: '传真' },
  { prop: 'status', label: '状态', type: 'status', required: true },
  { prop: 'sort', label: '排序', type: 'number' },
  { prop: 'taxNo', label: '纳税人识别号' },
  { prop: 'taxPercent', label: '税率', type: 'number' },
  { prop: 'bankName', label: '开户行' },
  { prop: 'bankAccount', label: '开户账号' },
  { prop: 'bankAddress', label: '开户地址' },
  { prop: 'remark', label: '备注', type: 'textarea' },
]

function orderBaseFields(party: 'customer' | 'supplier', timeProp: string, timeLabel: string): ErpField[] {
  return [
    { prop: 'no', label: '单号', readonly: true, searchable: true },
    { prop: timeProp, label: timeLabel, type: 'date', required: true, searchable: true },
    party === 'supplier'
      ? { prop: 'supplierId', label: '供应商', type: 'picker', required: true, searchable: true, optionsKey: 'supplier', labelField: 'supplierName' }
      : { prop: 'customerId', label: '客户', type: 'picker', required: true, searchable: true, optionsKey: 'customer', labelField: 'customerName' },
    { prop: 'accountId', label: '结算账户', type: 'picker', optionsKey: 'account', labelField: 'accountName' },
    { prop: 'saleUserId', label: '销售人员', type: 'picker', optionsKey: 'user', labelField: 'saleUserName', hiddenInList: true },
    { prop: 'financeUserId', label: '财务人员', type: 'picker', optionsKey: 'user', labelField: 'financeUserName', hiddenInList: true },
    { prop: 'orderNo', label: '关联订单', searchable: true },
    { prop: 'discountPercent', label: '优惠率', type: 'number', hiddenInList: true },
    { prop: 'discountPrice', label: '优惠金额', type: 'money', hiddenInList: true },
    { prop: 'otherPrice', label: '其它费用', type: 'money', hiddenInList: true },
    { prop: 'depositPrice', label: '订金', type: 'money', hiddenInList: true },
    { prop: 'totalCount', label: '合计数量', type: 'number' },
    { prop: 'totalPrice', label: '合计金额', type: 'money' },
    { prop: 'paymentPrice', label: '实际付款', type: 'money' },
    { prop: 'receiptPrice', label: '实际收款', type: 'money' },
    { prop: 'refundPrice', label: '应退金额', type: 'money' },
    { prop: 'status', label: '状态', type: 'audit-status', searchable: true, readonly: true },
    { prop: 'remark', label: '备注', type: 'textarea' },
    { prop: 'fileUrl', label: '附件', type: 'file', hiddenInList: true },
    { prop: 'items', label: '商品明细', type: 'items', hiddenInList: true },
  ]
}

const productInfoFields: ErpField[] = [
  { prop: 'productName', label: '产品名称', readonly: true, hiddenWhenEmpty: true },
  { prop: 'stockCount', label: '库存', type: 'number', readonly: true, hiddenWhenEmpty: true },
  { prop: 'productBarCode', label: '条码', readonly: true, hiddenWhenEmpty: true },
  { prop: 'productUnitName', label: '单位', readonly: true, hiddenWhenEmpty: true },
]

const orderCountFields: ErpField[] = [
  { prop: 'totalCount', label: '原数量', type: 'number', readonly: true, hiddenWhenEmpty: true },
  { prop: 'inCount', label: '已入库', type: 'number', readonly: true, hiddenWhenEmpty: true },
  { prop: 'outCount', label: '已出库', type: 'number', readonly: true, hiddenWhenEmpty: true },
  { prop: 'returnCount', label: '已退货', type: 'number', readonly: true, hiddenWhenEmpty: true },
]

const taxAmountFields: ErpField[] = [
  { prop: 'count', label: '数量', type: 'number', required: true },
  { prop: 'productPrice', label: '产品单价', type: 'money', required: true },
  { prop: 'totalProductPrice', label: '金额', type: 'money', readonly: true, hiddenWhenEmpty: true },
  { prop: 'taxPercent', label: '税率（%）', type: 'number' },
  { prop: 'taxPrice', label: '税额', type: 'money', readonly: true, hiddenWhenEmpty: true },
  { prop: 'totalPrice', label: '税额合计', type: 'money', readonly: true, hiddenWhenEmpty: true },
  { prop: 'remark', label: '备注', type: 'textarea' },
]

const orderItemFields: ErpField[] = [
  { prop: 'productId', label: '产品', type: 'picker', required: true, optionsKey: 'product', labelField: 'productName' },
  ...productInfoFields,
  ...taxAmountFields,
]

const warehouseOrderItemFields: ErpField[] = [
  { prop: 'warehouseId', label: '仓库', type: 'picker', optionsKey: 'warehouse', labelField: 'warehouseName' },
  { prop: 'productId', label: '产品', type: 'picker', required: true, optionsKey: 'product', labelField: 'productName' },
  ...productInfoFields,
  ...orderCountFields,
  ...taxAmountFields,
]

const stockItemFields: ErpField[] = [
  { prop: 'warehouseId', label: '仓库', type: 'picker', required: true, optionsKey: 'warehouse', labelField: 'warehouseName' },
  { prop: 'productId', label: '产品', type: 'picker', required: true, optionsKey: 'product', labelField: 'productName' },
  ...productInfoFields,
  { prop: 'count', label: '数量', type: 'number', required: true },
  { prop: 'productPrice', label: '产品单价', type: 'money' },
  { prop: 'totalPrice', label: '合计金额', type: 'money', readonly: true, hiddenWhenEmpty: true },
  { prop: 'remark', label: '备注', type: 'textarea' },
]

const stockMoveItemFields: ErpField[] = [
  { prop: 'fromWarehouseId', label: '调出仓库', type: 'picker', required: true, optionsKey: 'warehouse', labelField: 'fromWarehouseName' },
  { prop: 'toWarehouseId', label: '调入仓库', type: 'picker', required: true, optionsKey: 'warehouse', labelField: 'toWarehouseName' },
  { prop: 'productId', label: '产品', type: 'picker', required: true, optionsKey: 'product', labelField: 'productName' },
  ...productInfoFields,
  { prop: 'count', label: '数量', type: 'number', required: true },
  { prop: 'productPrice', label: '产品单价', type: 'money' },
  { prop: 'totalPrice', label: '合计金额', type: 'money', readonly: true, hiddenWhenEmpty: true },
  { prop: 'remark', label: '备注', type: 'textarea' },
]

const stockCheckItemFields: ErpField[] = [
  { prop: 'warehouseId', label: '仓库名字', type: 'picker', required: true, optionsKey: 'warehouse', labelField: 'warehouseName' },
  { prop: 'productId', label: '产品', type: 'picker', required: true, optionsKey: 'product', labelField: 'productName' },
  { prop: 'productName', label: '产品名称', readonly: true, hiddenWhenEmpty: true },
  { prop: 'stockCount', label: '账面库存', type: 'number', readonly: true, hiddenWhenEmpty: true },
  { prop: 'productBarCode', label: '条码', readonly: true, hiddenWhenEmpty: true },
  { prop: 'productUnitName', label: '单位', readonly: true, hiddenWhenEmpty: true },
  { prop: 'actualCount', label: '实际库存', type: 'number', required: true },
  { prop: 'count', label: '盈亏数量', type: 'number', readonly: true, hiddenWhenEmpty: true },
  { prop: 'productPrice', label: '产品单价', type: 'money' },
  { prop: 'totalPrice', label: '合计金额', type: 'money', readonly: true, hiddenWhenEmpty: true },
  { prop: 'remark', label: '备注', type: 'textarea' },
]

const financePaymentItemFields: ErpField[] = [
  { prop: 'bizNo', label: '采购单据编号', required: true },
  { prop: 'bizId', label: '采购单据编号ID', type: 'number', hiddenInDetail: true },
  { prop: 'bizType', label: '采购业务类型', type: 'number', hiddenInDetail: true },
  { prop: 'totalPrice', label: '应付金额', type: 'money', readonly: true, hiddenWhenEmpty: true },
  { prop: 'paidPrice', label: '已付金额', type: 'money', readonly: true, hiddenWhenEmpty: true },
  { prop: 'paymentPrice', label: '本次付款', type: 'money', required: true },
  { prop: 'remark', label: '备注', type: 'textarea' },
]

const financeReceiptItemFields: ErpField[] = [
  { prop: 'bizNo', label: '销售单据编号', required: true },
  { prop: 'bizId', label: '销售单据编号ID', type: 'number', hiddenInDetail: true },
  { prop: 'bizType', label: '销售业务类型', type: 'number', hiddenInDetail: true },
  { prop: 'totalPrice', label: '应收金额', type: 'money', readonly: true, hiddenWhenEmpty: true },
  { prop: 'receiptedPrice', label: '已收金额', type: 'money', readonly: true, hiddenWhenEmpty: true },
  { prop: 'receiptPrice', label: '本次收款', type: 'money', required: true },
  { prop: 'remark', label: '备注', type: 'textarea' },
]

export const erpOptionLoaders: Record<ErpOptionKey, () => Promise<any[]>> = {
  account: AccountApi.getAccountSimpleList,
  category: ProductCategoryApi.getProductCategorySimpleList,
  customer: CustomerApi.getCustomerSimpleList,
  product: ProductApi.getProductSimpleList,
  supplier: SupplierApi.getSupplierSimpleList,
  unit: ProductUnitApi.getProductUnitSimpleList,
  user: getSimpleUserList,
  warehouse: WarehouseApi.getWarehouseSimpleList,
}

export const erpStatistics = {
  getPurchaseSummary: PurchaseStatisticsApi.getPurchaseSummary,
  getPurchaseTimeSummary: PurchaseStatisticsApi.getPurchaseTimeSummary,
  getSaleSummary: SaleStatisticsApi.getSaleSummary,
  getSaleTimeSummary: SaleStatisticsApi.getSaleTimeSummary,
}

export const erpModules: ErpModule[] = [
  {
    key: 'product-category',
    group: 'product',
    title: '产品分类',
    icon: 'folder',
    iconColor: '#13c2c2',
    permission: 'erp:product-category',
    route: '/pages-erp/product/category/index',
    exportConfig: { url: '/erp/product-category/export-excel', fileName: '产品分类.xls' },
    listMode: 'list',
    fields: [
      { prop: 'name', label: '分类名称', searchable: true, required: true },
      { prop: 'code', label: '分类编码', searchable: true, required: true },
      { prop: 'parentId', label: '父分类', type: 'picker', optionsKey: 'category', labelField: 'parentName' },
      { prop: 'sort', label: '排序', type: 'number' },
      { prop: 'status', label: '状态', type: 'status', required: true },
    ],
    operations: { list: ProductCategoryApi.getProductCategoryList, get: ProductCategoryApi.getProductCategory, create: ProductCategoryApi.createProductCategory, update: ProductCategoryApi.updateProductCategory, delete: ProductCategoryApi.deleteProductCategory },
  },
  {
    key: 'product',
    group: 'product',
    title: '产品管理',
    icon: 'goods',
    iconColor: '#1890ff',
    permission: 'erp:product',
    route: '/pages-erp/product/product/index',
    exportConfig: { url: '/erp/product/export-excel', fileName: '产品.xls' },
    listMode: 'page',
    fields: [
      { prop: 'name', label: '产品名称', searchable: true, required: true },
      { prop: 'barCode', label: '产品条码', searchable: true },
      { prop: 'categoryId', label: '产品分类', type: 'picker', required: true, optionsKey: 'category', labelField: 'categoryName' },
      { prop: 'unitId', label: '单位', type: 'picker', required: true, optionsKey: 'unit', labelField: 'unitName' },
      { prop: 'status', label: '状态', type: 'status', required: true },
      { prop: 'standard', label: '规格' },
      { prop: 'expiryDay', label: '保质期天数', type: 'number' },
      { prop: 'weight', label: '重量（kg）', type: 'number' },
      { prop: 'purchasePrice', label: '采购价格', type: 'money' },
      { prop: 'salePrice', label: '销售价格', type: 'money' },
      { prop: 'minPrice', label: '最低价格', type: 'money' },
      { prop: 'remark', label: '备注', type: 'textarea' },
    ],
    operations: { page: ProductApi.getProductPage, get: ProductApi.getProduct, create: ProductApi.createProduct, update: ProductApi.updateProduct, delete: ProductApi.deleteProduct },
  },
  {
    key: 'product-unit',
    group: 'product',
    title: '产品单位',
    icon: 'app',
    iconColor: '#2f54eb',
    permission: 'erp:product-unit',
    route: '/pages-erp/product/unit/index',
    exportConfig: { url: '/erp/product-unit/export-excel', fileName: '产品单位.xls' },
    listMode: 'page',
    fields: [
      { prop: 'name', label: '单位名称', searchable: true, required: true },
      { prop: 'status', label: '状态', type: 'status', required: true },
    ],
    operations: { page: ProductUnitApi.getProductUnitPage, get: ProductUnitApi.getProductUnit, create: ProductUnitApi.createProductUnit, update: ProductUnitApi.updateProductUnit, delete: ProductUnitApi.deleteProductUnit },
  },
  {
    key: 'supplier',
    group: 'purchase',
    title: '供应商',
    icon: 'usergroup',
    iconColor: '#fa8c16',
    permission: 'erp:supplier',
    route: '/pages-erp/purchase/supplier/index',
    exportConfig: { url: '/erp/supplier/export-excel', fileName: '供应商.xls' },
    listMode: 'page',
    fields: contactFields.map(field => field.prop === 'name' ? { ...field, label: '供应商名称' } : field),
    operations: { page: SupplierApi.getSupplierPage, get: SupplierApi.getSupplier, create: SupplierApi.createSupplier, update: SupplierApi.updateSupplier, delete: SupplierApi.deleteSupplier },
  },
  {
    key: 'purchase-order',
    group: 'purchase',
    title: '采购订单',
    icon: 'order',
    iconColor: '#faad14',
    permission: 'erp:purchase-order',
    route: '/pages-erp/purchase/order/index',
    exportConfig: { url: '/erp/purchase-order/export-excel', fileName: '采购订单.xls' },
    listMode: 'page',
    fields: orderBaseFields('supplier', 'orderTime', '订单时间').filter(field => !['saleUserId', 'financeUserId', 'orderNo', 'otherPrice', 'paymentPrice', 'receiptPrice', 'refundPrice'].includes(field.prop)),
    itemFields: orderItemFields,
    operations: { page: PurchaseOrderApi.getPurchaseOrderPage, get: PurchaseOrderApi.getPurchaseOrder, create: PurchaseOrderApi.createPurchaseOrder, update: PurchaseOrderApi.updatePurchaseOrder, delete: id => PurchaseOrderApi.deletePurchaseOrder([id]), updateStatus: PurchaseOrderApi.updatePurchaseOrderStatus },
  },
  {
    key: 'purchase-in',
    group: 'purchase',
    title: '采购入库',
    icon: 'download',
    iconColor: '#ffc53d',
    permission: 'erp:purchase-in',
    route: '/pages-erp/purchase/in/index',
    exportConfig: { url: '/erp/purchase-in/export-excel', fileName: '采购入库.xls' },
    listMode: 'page',
    fields: orderBaseFields('supplier', 'inTime', '入库时间').filter(field => !['saleUserId', 'financeUserId', 'depositPrice', 'receiptPrice', 'refundPrice'].includes(field.prop)),
    itemFields: warehouseOrderItemFields,
    operations: { page: PurchaseInApi.getPurchaseInPage, get: PurchaseInApi.getPurchaseIn, create: PurchaseInApi.createPurchaseIn, update: PurchaseInApi.updatePurchaseIn, delete: id => PurchaseInApi.deletePurchaseIn([id]), updateStatus: PurchaseInApi.updatePurchaseInStatus },
  },
  {
    key: 'purchase-return',
    group: 'purchase',
    title: '采购退货',
    icon: 'undo',
    iconColor: '#ff7a45',
    permission: 'erp:purchase-return',
    route: '/pages-erp/purchase/return/index',
    exportConfig: { url: '/erp/purchase-return/export-excel', fileName: '采购退货.xls' },
    listMode: 'page',
    fields: orderBaseFields('supplier', 'returnTime', '退货时间').filter(field => !['saleUserId', 'financeUserId', 'depositPrice', 'paymentPrice', 'receiptPrice'].includes(field.prop)),
    itemFields: warehouseOrderItemFields,
    operations: { page: PurchaseReturnApi.getPurchaseReturnPage, get: PurchaseReturnApi.getPurchaseReturn, create: PurchaseReturnApi.createPurchaseReturn, update: PurchaseReturnApi.updatePurchaseReturn, delete: id => PurchaseReturnApi.deletePurchaseReturn([id]), updateStatus: PurchaseReturnApi.updatePurchaseReturnStatus },
  },
  {
    key: 'customer',
    group: 'sale',
    title: '客户',
    icon: 'user',
    iconColor: '#52c41a',
    permission: 'erp:customer',
    route: '/pages-erp/sale/customer/index',
    exportConfig: { url: '/erp/customer/export-excel', fileName: '客户.xls' },
    listMode: 'page',
    fields: contactFields.map(field => field.prop === 'name' ? { ...field, label: '客户名称' } : field),
    operations: { page: CustomerApi.getCustomerPage, get: CustomerApi.getCustomer, create: CustomerApi.createCustomer, update: CustomerApi.updateCustomer, delete: CustomerApi.deleteCustomer },
  },
  {
    key: 'sale-order',
    group: 'sale',
    title: '销售订单',
    icon: 'cart',
    iconColor: '#73d13d',
    permission: 'erp:sale-order',
    route: '/pages-erp/sale/order/index',
    exportConfig: { url: '/erp/sale-order/export-excel', fileName: '销售订单.xls' },
    listMode: 'page',
    fields: orderBaseFields('customer', 'orderTime', '订单时间').filter(field => !['financeUserId', 'orderNo', 'otherPrice', 'paymentPrice', 'receiptPrice', 'refundPrice'].includes(field.prop)),
    itemFields: orderItemFields,
    operations: { page: SaleOrderApi.getSaleOrderPage, get: SaleOrderApi.getSaleOrder, create: SaleOrderApi.createSaleOrder, update: SaleOrderApi.updateSaleOrder, delete: id => SaleOrderApi.deleteSaleOrder([id]), updateStatus: SaleOrderApi.updateSaleOrderStatus },
  },
  {
    key: 'sale-out',
    group: 'sale',
    title: '销售出库',
    icon: 'upload',
    iconColor: '#95de64',
    permission: 'erp:sale-out',
    route: '/pages-erp/sale/out/index',
    exportConfig: { url: '/erp/sale-out/export-excel', fileName: '销售出库.xls' },
    listMode: 'page',
    fields: orderBaseFields('customer', 'outTime', '出库时间').filter(field => !['financeUserId', 'depositPrice', 'paymentPrice', 'refundPrice'].includes(field.prop)),
    itemFields: warehouseOrderItemFields,
    operations: { page: SaleOutApi.getSaleOutPage, get: SaleOutApi.getSaleOut, create: SaleOutApi.createSaleOut, update: SaleOutApi.updateSaleOut, delete: id => SaleOutApi.deleteSaleOut([id]), updateStatus: SaleOutApi.updateSaleOutStatus },
  },
  {
    key: 'sale-return',
    group: 'sale',
    title: '销售退货',
    icon: 'rollback',
    iconColor: '#389e0d',
    permission: 'erp:sale-return',
    route: '/pages-erp/sale/return/index',
    exportConfig: { url: '/erp/sale-return/export-excel', fileName: '销售退货.xls' },
    listMode: 'page',
    fields: orderBaseFields('customer', 'returnTime', '退货时间').filter(field => !['financeUserId', 'depositPrice', 'paymentPrice', 'receiptPrice'].includes(field.prop)),
    itemFields: warehouseOrderItemFields,
    operations: { page: SaleReturnApi.getSaleReturnPage, get: SaleReturnApi.getSaleReturn, create: SaleReturnApi.createSaleReturn, update: SaleReturnApi.updateSaleReturn, delete: id => SaleReturnApi.deleteSaleReturn([id]), updateStatus: SaleReturnApi.updateSaleReturnStatus },
  },
  {
    key: 'warehouse',
    group: 'stock',
    title: '仓库管理',
    icon: 'home',
    iconColor: '#722ed1',
    permission: 'erp:warehouse',
    route: '/pages-erp/stock/warehouse/index',
    exportConfig: { url: '/erp/warehouse/export-excel', fileName: '仓库.xls' },
    listMode: 'page',
    fields: [
      { prop: 'name', label: '仓库名称', searchable: true, required: true },
      { prop: 'address', label: '仓库地址' },
      { prop: 'principal', label: '负责人' },
      { prop: 'warehousePrice', label: '仓储费', type: 'money' },
      { prop: 'truckagePrice', label: '搬运费', type: 'money' },
      { prop: 'defaultStatus', label: '是否默认', type: 'boolean', readonly: true },
      { prop: 'status', label: '状态', type: 'status', required: true },
      { prop: 'sort', label: '排序', type: 'number' },
      { prop: 'remark', label: '备注', type: 'textarea' },
    ],
    operations: { page: WarehouseApi.getWarehousePage, get: WarehouseApi.getWarehouse, create: WarehouseApi.createWarehouse, update: WarehouseApi.updateWarehouse, delete: WarehouseApi.deleteWarehouse, updateDefaultStatus: WarehouseApi.updateWarehouseDefaultStatus },
  },
  {
    key: 'stock',
    group: 'stock',
    title: '产品库存',
    icon: 'chart-pie',
    iconColor: '#9254de',
    permission: 'erp:stock',
    route: '/pages-erp/stock/stock/index',
    exportConfig: { url: '/erp/stock/export-excel', fileName: '产品库存.xls' },
    listMode: 'page',
    readonly: true,
    fields: [
      { prop: 'productId', label: '产品', type: 'picker', searchable: true, optionsKey: 'product', labelField: 'productName' },
      { prop: 'warehouseId', label: '仓库', type: 'picker', searchable: true, optionsKey: 'warehouse', labelField: 'warehouseName' },
      { prop: 'count', label: '库存数量', type: 'number' },
    ],
    operations: { page: StockApi.getStockPage, get: StockApi.getStock },
  },
  {
    key: 'stock-record',
    group: 'stock',
    title: '库存明细',
    icon: 'list',
    iconColor: '#597ef7',
    permission: 'erp:stock-record',
    route: '/pages-erp/stock/record/index',
    exportConfig: { url: '/erp/stock-record/export-excel', fileName: '库存明细.xls' },
    listMode: 'page',
    readonly: true,
    fields: [
      { prop: 'productId', label: '产品', type: 'picker', searchable: true, optionsKey: 'product', labelField: 'productName' },
      { prop: 'warehouseId', label: '仓库', type: 'picker', searchable: true, optionsKey: 'warehouse', labelField: 'warehouseName' },
      { prop: 'count', label: '出入库数量', type: 'number' },
      { prop: 'totalCount', label: '总库存量', type: 'number' },
      { prop: 'bizType', label: '业务类型', type: 'dict', dictType: ERP_STOCK_RECORD_BIZ_TYPE, searchable: true },
      { prop: 'bizNo', label: '业务单号', searchable: true },
      { prop: 'bizId', label: '业务编号', type: 'number', hiddenInList: true },
      { prop: 'bizItemId', label: '业务项编号', type: 'number', hiddenInList: true },
    ],
    operations: { page: StockRecordApi.getStockRecordPage, get: StockRecordApi.getStockRecord },
  },
  {
    key: 'stock-in',
    group: 'stock',
    title: '其它入库',
    icon: 'download',
    iconColor: '#36cfc9',
    permission: 'erp:stock-in',
    route: '/pages-erp/stock/in/index',
    exportConfig: { url: '/erp/stock-in/export-excel', fileName: '其它入库单.xls' },
    listMode: 'page',
    fields: orderBaseFields('supplier', 'inTime', '入库时间').filter(field => !['accountId', 'saleUserId', 'financeUserId', 'orderNo', 'discountPercent', 'discountPrice', 'otherPrice', 'depositPrice', 'paymentPrice', 'receiptPrice', 'refundPrice'].includes(field.prop)),
    itemFields: stockItemFields,
    operations: { page: StockInApi.getStockInPage, get: StockInApi.getStockIn, create: StockInApi.createStockIn, update: StockInApi.updateStockIn, delete: id => StockInApi.deleteStockIn([id]), updateStatus: StockInApi.updateStockInStatus },
  },
  {
    key: 'stock-out',
    group: 'stock',
    title: '其它出库',
    icon: 'upload',
    iconColor: '#13c2c2',
    permission: 'erp:stock-out',
    route: '/pages-erp/stock/out/index',
    exportConfig: { url: '/erp/stock-out/export-excel', fileName: '其它出库单.xls' },
    listMode: 'page',
    fields: orderBaseFields('customer', 'outTime', '出库时间').filter(field => !['accountId', 'saleUserId', 'financeUserId', 'orderNo', 'discountPercent', 'discountPrice', 'otherPrice', 'depositPrice', 'paymentPrice', 'receiptPrice', 'refundPrice'].includes(field.prop)),
    itemFields: stockItemFields,
    operations: { page: StockOutApi.getStockOutPage, get: StockOutApi.getStockOut, create: StockOutApi.createStockOut, update: StockOutApi.updateStockOut, delete: id => StockOutApi.deleteStockOut([id]), updateStatus: StockOutApi.updateStockOutStatus },
  },
  {
    key: 'stock-move',
    group: 'stock',
    title: '库存调拨',
    icon: 'swap',
    iconColor: '#5cdbd3',
    permission: 'erp:stock-move',
    route: '/pages-erp/stock/move/index',
    exportConfig: { url: '/erp/stock-move/export-excel', fileName: '库存调拨单.xls' },
    listMode: 'page',
    fields: orderBaseFields('supplier', 'moveTime', '调拨时间').filter(field => !['supplierId', 'accountId', 'saleUserId', 'financeUserId', 'orderNo', 'discountPercent', 'discountPrice', 'otherPrice', 'depositPrice', 'paymentPrice', 'receiptPrice', 'refundPrice'].includes(field.prop)),
    itemFields: stockMoveItemFields,
    operations: { page: StockMoveApi.getStockMovePage, get: StockMoveApi.getStockMove, create: StockMoveApi.createStockMove, update: StockMoveApi.updateStockMove, delete: id => StockMoveApi.deleteStockMove([id]), updateStatus: StockMoveApi.updateStockMoveStatus },
  },
  {
    key: 'stock-check',
    group: 'stock',
    title: '库存盘点',
    icon: 'check-circle',
    iconColor: '#87e8de',
    permission: 'erp:stock-check',
    route: '/pages-erp/stock/check/index',
    exportConfig: { url: '/erp/stock-check/export-excel', fileName: '库存盘点单.xls' },
    listMode: 'page',
    fields: orderBaseFields('supplier', 'checkTime', '盘点时间').filter(field => !['supplierId', 'accountId', 'saleUserId', 'financeUserId', 'orderNo', 'discountPercent', 'discountPrice', 'otherPrice', 'depositPrice', 'paymentPrice', 'receiptPrice', 'refundPrice'].includes(field.prop)),
    itemFields: stockCheckItemFields,
    operations: { page: StockCheckApi.getStockCheckPage, get: StockCheckApi.getStockCheck, create: StockCheckApi.createStockCheck, update: StockCheckApi.updateStockCheck, delete: id => StockCheckApi.deleteStockCheck([id]), updateStatus: StockCheckApi.updateStockCheckStatus },
  },
  {
    key: 'account',
    group: 'finance',
    title: '结算账户',
    icon: 'wallet',
    iconColor: '#eb2f96',
    permission: 'erp:account',
    route: '/pages-erp/finance/account/index',
    exportConfig: { url: '/erp/account/export-excel', fileName: 'ERP 结算账户.xls' },
    listMode: 'page',
    fields: [
      { prop: 'name', label: '账户名称', searchable: true, required: true },
      { prop: 'no', label: '账户编码', searchable: true, required: true },
      { prop: 'defaultStatus', label: '是否默认', type: 'boolean', readonly: true },
      { prop: 'status', label: '状态', type: 'status', required: true },
      { prop: 'sort', label: '排序', type: 'number' },
      { prop: 'remark', label: '备注', type: 'textarea' },
    ],
    operations: { page: AccountApi.getAccountPage, get: AccountApi.getAccount, create: AccountApi.createAccount, update: AccountApi.updateAccount, delete: AccountApi.deleteAccount, updateDefaultStatus: AccountApi.updateAccountDefaultStatus },
  },
  {
    key: 'finance-payment',
    group: 'finance',
    title: '付款单',
    icon: 'money-circle',
    iconColor: '#f759ab',
    permission: 'erp:finance-payment',
    route: '/pages-erp/finance/payment/index',
    exportConfig: { url: '/erp/finance-payment/export-excel', fileName: '付款单.xls' },
    listMode: 'page',
    fields: orderBaseFields('supplier', 'paymentTime', '付款时间').filter(field => !['saleUserId', 'orderNo', 'discountPercent', 'otherPrice', 'depositPrice', 'receiptPrice', 'refundPrice', 'totalCount'].includes(field.prop)),
    itemFields: financePaymentItemFields,
    operations: { page: FinancePaymentApi.getFinancePaymentPage, get: FinancePaymentApi.getFinancePayment, create: FinancePaymentApi.createFinancePayment, update: FinancePaymentApi.updateFinancePayment, delete: id => FinancePaymentApi.deleteFinancePayment([id]), updateStatus: FinancePaymentApi.updateFinancePaymentStatus },
  },
  {
    key: 'finance-receipt',
    group: 'finance',
    title: '收款单',
    icon: 'money-circle',
    iconColor: '#ff85c0',
    permission: 'erp:finance-receipt',
    route: '/pages-erp/finance/receipt/index',
    exportConfig: { url: '/erp/finance-receipt/export-excel', fileName: '收款单.xls' },
    listMode: 'page',
    fields: orderBaseFields('customer', 'receiptTime', '收款时间').filter(field => !['saleUserId', 'orderNo', 'discountPercent', 'otherPrice', 'depositPrice', 'paymentPrice', 'refundPrice', 'totalCount'].includes(field.prop)),
    itemFields: financeReceiptItemFields,
    operations: { page: FinanceReceiptApi.getFinanceReceiptPage, get: FinanceReceiptApi.getFinanceReceipt, create: FinanceReceiptApi.createFinanceReceipt, update: FinanceReceiptApi.updateFinanceReceipt, delete: id => FinanceReceiptApi.deleteFinanceReceipt([id]), updateStatus: FinanceReceiptApi.updateFinanceReceiptStatus },
  },
]

export function getErpModule(key?: string) {
  return erpModules.find(item => item.key === key)
}

export function getErpItemFields(module?: ErpModule) {
  return module?.itemFields || orderItemFields
}

export function getErpGroupModules(group: string) {
  return erpModules.filter(item => item.group === group)
}
