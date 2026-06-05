import type { FormSchema, FormSchemaIssue } from '@wot-ui/ui/components/wd-form/types'
import type { FormCreateFieldState, FormCreateRule, NormalizedFormCreateRule } from '../../../types/typing'
import { getValidateRules } from './provider'
import { isEmptyValue, isRuleHidden, normalizeRules } from './utils'

const SUB_FORM_TYPES = new Set(['group', 'Group', 'fcGroup', 'FcGroup', 'array', 'Array', 'tableForm', 'subTable', 'fcTableForm'])

export function createFormSchema(
  rules: () => NormalizedFormCreateRule[],
  fieldStates: Record<string, FormCreateFieldState>,
): FormSchema {
  return {
    async validate(model) {
      const issues: FormSchemaIssue[] = []
      for (const rule of rules()) {
        if (!rule.field || isRuleHidden(rule, fieldStates[rule.field])) {
          continue
        }
        const value = model[rule.field]
        if (isSubFormRule(rule)) {
          await validateSubFormRule(rule, value, issues)
          continue
        }
        for (const validateRule of getValidateRules(rule, fieldStates[rule.field])) {
          if (validateRule.required && isEmptyValue(value)) {
            issues.push(createIssue(rule.field, validateRule.message || `${rule.title || '该字段'}不能为空`))
            break
          }
          if (isEmptyValue(value)) {
            continue
          }
          if (validateRule.pattern) {
            const pattern = typeof validateRule.pattern === 'string'
              ? new RegExp(validateRule.pattern)
              : validateRule.pattern
            if (!pattern.test(String(value))) {
              issues.push(createIssue(rule.field, validateRule.message || `${rule.title || '该字段'}格式不正确`))
              break
            }
          }
          if (validateRule.validator) {
            const result = await validateRule.validator(value)
            if (result === false || typeof result === 'string') {
              issues.push(createIssue(rule.field, typeof result === 'string' ? result : validateRule.message || `${rule.title || '该字段'}校验失败`))
              break
            }
          }
        }
      }
      return issues
    },
    isRequired(path) {
      const prop = normalizePath(path)
      const rule = rules().find(item => item.field === prop)
      if (rule) {
        return getValidateRules(rule, fieldStates[rule.field]).some(item => item.required)
      }
      const childRule = findSubFormChildRule(rules(), prop)
      return !!(childRule && getValidateRules(childRule).some(item => item.required))
    },
  }
}

async function validateSubFormRule(rule: NormalizedFormCreateRule, value: any, issues: FormSchemaIssue[]) {
  for (const validateRule of getValidateRules(rule)) {
    if (validateRule.required && (!Array.isArray(value) || value.length === 0)) {
      issues.push(createIssue(rule.field, validateRule.message || `${rule.title || '子表单'}不能为空`))
      return
    }
  }

  if (!Array.isArray(value) || value.length === 0) {
    return
  }

  const children = getSubFormChildRules(rule)
  for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
    const row = value[rowIndex]
    for (const childRule of children) {
      if (!childRule.field || isRuleHidden(childRule)) {
        continue
      }
      const childValue = row?.[childRule.field]
      for (const validateRule of getValidateRules(childRule)) {
        if (validateRule.required && isEmptyValue(childValue)) {
          issues.push(createIssue(getSubFormPath(rule.field, rowIndex, childRule.field), validateRule.message || `${childRule.title || '该字段'}不能为空`))
          break
        }
        if (isEmptyValue(childValue)) {
          continue
        }
        if (validateRule.pattern) {
          const pattern = typeof validateRule.pattern === 'string'
            ? new RegExp(validateRule.pattern)
            : validateRule.pattern
          if (!pattern.test(String(childValue))) {
            issues.push(createIssue(getSubFormPath(rule.field, rowIndex, childRule.field), validateRule.message || `${childRule.title || '该字段'}格式不正确`))
            break
          }
        }
        if (validateRule.validator) {
          const result = await validateRule.validator(childValue)
          if (result === false || typeof result === 'string') {
            issues.push(createIssue(getSubFormPath(rule.field, rowIndex, childRule.field), typeof result === 'string' ? result : validateRule.message || `${childRule.title || '该字段'}校验失败`))
            break
          }
        }
      }
    }
  }
}

function isSubFormRule(rule: FormCreateRule) {
  return SUB_FORM_TYPES.has(rule.type)
}

function getSubFormChildRules(rule: FormCreateRule) {
  const children = rule.props?.rule || rule.children
  if (Array.isArray(children)) {
    return normalizeRules(children)
  }
  if (Array.isArray(rule.props?.columns)) {
    const rules = rule.props.columns.flatMap((column: Record<string, any>) => Array.isArray(column.rule) ? column.rule : [])
    return normalizeRules(rules)
  }
  return []
}

function findSubFormChildRule(rules: NormalizedFormCreateRule[], path: string) {
  for (const rule of rules) {
    if (!rule.field || !isSubFormRule(rule)) {
      continue
    }
    const prefix = `${rule.field}.`
    if (!path.startsWith(prefix)) {
      continue
    }
    const [, childField] = path.slice(prefix.length).split(/\.(.+)/)
    if (!childField) {
      continue
    }
    const childRule = getSubFormChildRules(rule).find(item => item.field === childField)
    if (childRule) {
      return childRule
    }
  }
}

function getSubFormPath(field: string, rowIndex: number, childField: string) {
  return `${field}.${rowIndex}.${childField}`
}

function normalizePath(path: unknown) {
  return Array.isArray(path) ? path.join('.') : String(path)
}

function createIssue(field: string, message: string): FormSchemaIssue {
  return {
    path: field.split('.'),
    message,
  }
}

export function createFieldStates(rules: FormCreateRule[]) {
  return rules.reduce<Record<string, FormCreateFieldState>>((states, rule) => {
    if (rule.field) {
      states[rule.field] = {}
    }
    return states
  }, {})
}
