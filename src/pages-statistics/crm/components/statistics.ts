// TODO @芋艿：这里后续要考虑下，要不要作为公用部分？还是这么做就是合理的？？？
import type { Dept } from '@/api/system/dept'
import { getDictLabel } from '@/hooks/useDict'

export const DEFAULT_VISIBLE_ROWS = 10 // 默认展示行数（折叠态）
export const MAX_VISIBLE_ROWS = 50 // 展开后的最大展示行数，避免渲染超大列表

export interface StatisticsColumn {
  prop: string
  label: string
  dictType?: string
  type?: 'money' | 'percent'
}

export interface StatisticsChartSeries {
  name: string
  prop: string
  type?: 'bar' | 'line'
}

export interface StatisticsChart {
  type: 'line' | 'bar' | 'pie' | 'funnel'
  categoryProp?: string
  valueProp?: string
  series?: StatisticsChartSeries[]
  money?: boolean
}

export interface StatisticsSection {
  title: string
  columns?: StatisticsColumn[]
  chart?: StatisticsChart
  load?: (params: Record<string, any>) => Promise<any>
}

/** 获取默认部门编号 */
export function getDefaultDeptId(userInfo: Record<string, any> | undefined) {
  const deptId = Number(userInfo?.deptId)
  return deptId > 0 ? deptId : undefined
}

/** 获取第一个可用部门编号 */
export function getFirstDeptId(list: Dept[]): number | undefined {
  for (const item of list) {
    if (item.id) {
      return item.id
    }
    const childId = getFirstDeptId(item.children || [])
    if (childId) {
      return childId
    }
  }
  return undefined
}

/** 统一转换统计结果 */
export function normalizeRows(data: any) {
  if (Array.isArray(data)) {
    return data
  }
  if (!data) {
    return []
  }
  return [data]
}

/** 构建图表配置 */
export function buildChartOption(section: StatisticsSection, rows: Record<string, any>[], options: { rank?: boolean } = {}) {
  if (!section.chart || rows.length === 0) {
    return undefined
  }
  if (section.chart.type === 'pie') {
    return buildPieOption(section, rows)
  }
  if (section.chart.type === 'funnel') {
    return buildFunnelOption(rows[0] || {})
  }
  return buildAxisOption(section, rows, options)
}

/** 获取图表高度 */
export function getChartHeight(section: StatisticsSection, options: { rank?: boolean } = {}) {
  if (options.rank || section.chart?.type === 'funnel') {
    return '480rpx'
  }
  if (section.chart?.type === 'pie') {
    return '420rpx'
  }
  return '460rpx'
}

/** 格式化字段值 */
export function formatColumnValue(row: Record<string, any>, column: StatisticsColumn) {
  const value = row[column.prop]
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (column.dictType) {
    return getDictLabel(column.dictType, value) || String(value)
  }
  if (column.type === 'money') {
    const amount = Number(value)
    return Number.isNaN(amount) ? String(value) : amount.toFixed(2)
  }
  if (column.type === 'percent') {
    return `${value}%`
  }
  return String(value)
}

/** 格式化未知结构 */
export function formatEntries(row: Record<string, any>) {
  return Object.entries(row)
    .filter(([, value]) => typeof value !== 'object')
    .map(([label, value]) => ({ label, value: value === undefined || value === null || value === '' ? '-' : String(value) }))
}

/** 格式化金额数值 */
export function formatMoneyValue(value: any) {
  const numberValue = Number(value || 0)
  return Number.isNaN(numberValue) ? String(value ?? '-') : numberValue.toFixed(2)
}

/** 转换为数字 */
export function toNumber(value: any) {
  const numberValue = Number(value || 0)
  return Number.isNaN(numberValue) ? 0 : numberValue
}

/** 图表配色 */
export function getChartColors() {
  return ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#faad14', '#f5222d']
}

/** 构建坐标轴图表 */
function buildAxisOption(section: StatisticsSection, rows: Record<string, any>[], options: { rank?: boolean }) {
  const chart = section.chart!
  const series = chart.series || []
  const displayRows = options.rank ? rows.slice(0, 10).reverse() : rows
  const categories = displayRows.map(row => getChartCategory(section, row, chart.categoryProp))
  return {
    color: getChartColors(),
    tooltip: {
      trigger: 'axis',
      confine: true,
      valueFormatter: (value: any) => chart.money ? formatMoneyValue(value) : String(value ?? '-'),
    },
    legend: {
      top: 0,
      type: 'scroll',
      textStyle: { color: '#666', fontSize: 11 },
    },
    grid: {
      left: options.rank ? 8 : 12,
      right: 12,
      top: 52,
      bottom: options.rank ? 20 : 34,
      containLabel: true,
    },
    xAxis: options.rank
      ? {
          type: 'value',
          axisLabel: { color: '#999', fontSize: 10 },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
        }
      : {
          type: 'category',
          data: categories,
          axisLabel: { color: '#999', fontSize: 10 },
          axisTick: { show: false },
        },
    yAxis: options.rank
      ? {
          type: 'category',
          data: categories,
          axisLabel: { color: '#666', fontSize: 10 },
          axisTick: { show: false },
        }
      : {
          type: 'value',
          axisLabel: { color: '#999', fontSize: 10 },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
        },
    series: series.map(item => ({
      name: item.name,
      type: options.rank ? 'bar' : item.type || chart.type,
      smooth: (item.type || chart.type) === 'line',
      barMaxWidth: 18,
      data: displayRows.map(row => toNumber(row[item.prop])),
    })),
  }
}

/** 构建饼图 */
function buildPieOption(section: StatisticsSection, rows: Record<string, any>[]) {
  const chart = section.chart!
  const valueProp = chart.valueProp || 'count'
  return {
    color: getChartColors(),
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      type: 'scroll',
      textStyle: { color: '#666', fontSize: 11 },
    },
    series: [
      {
        name: section.title,
        type: 'pie',
        radius: ['35%', '62%'],
        center: ['50%', '45%'],
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: '#666',
          fontSize: 10,
        },
        data: rows.map(row => ({
          name: getChartCategory(section, row, chart.categoryProp),
          value: toNumber(row[valueProp]),
        })),
      },
    ],
  }
}

/** 构建漏斗图 */
function buildFunnelOption(row: Record<string, any>) {
  return {
    color: getChartColors(),
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: '{b}: {c}',
    },
    series: [
      {
        name: '销售漏斗',
        type: 'funnel',
        left: '8%',
        right: '8%',
        top: 20,
        bottom: 20,
        sort: 'descending',
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n{c}',
          color: '#fff',
          fontSize: 12,
        },
        data: [
          { name: '客户数', value: toNumber(row.customerCount) },
          { name: '商机数', value: toNumber(row.businessCount) },
          { name: '赢单数', value: toNumber(row.businessWinCount) },
        ],
      },
    ],
  }
}

/** 获取图表类目文案 */
function getChartCategory(section: StatisticsSection, row: Record<string, any>, prop?: string) {
  if (!prop) {
    return '-'
  }
  const column = section.columns?.find(item => item.prop === prop)
  return formatColumnValue(row, column || { prop, label: prop })
}
