// TODO @AI：看看这个是不是去掉哈。
export interface ErpPickerOption {
  id: number | string
  name: string
  raw?: Record<string, any>
}

export interface ErpDetailItemField {
  prop: string
  label: string
  type?: 'count' | 'money' | 'number' | 'percent' | 'text'
  hiddenWhenEmpty?: boolean
  formatter?: (value: any, row: Record<string, any>) => string
}
