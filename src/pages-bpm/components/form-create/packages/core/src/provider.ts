import type { FormCreateFieldState, FormCreateRule, FormCreateValidateRule } from '../../../types/typing'

export function getRequiredRule(rule: FormCreateRule, state?: FormCreateFieldState): FormCreateValidateRule | undefined {
  if (state?.required === true || state?.controlRequired === true) {
    return {
      required: true,
      message: `${rule.title || '该字段'}不能为空`,
    }
  }
  if (rule.$required === true) {
    return {
      required: true,
      message: `${rule.title || '该字段'}不能为空`,
    }
  }
  if (typeof rule.$required === 'string') {
    return {
      required: true,
      message: rule.$required,
    }
  }
  if (rule.$required && typeof rule.$required === 'object') {
    return {
      required: true,
      ...rule.$required,
    }
  }
  if (rule.effect?.required === true) {
    return {
      required: true,
      message: `${rule.title || '该字段'}不能为空`,
    }
  }
  if (typeof rule.effect?.required === 'string') {
    return {
      required: true,
      message: rule.effect.required,
    }
  }
  if (rule.effect?.required && typeof rule.effect.required === 'object') {
    return {
      required: true,
      ...rule.effect.required,
    }
  }
  const validate = rule.validate?.find(item => item.required)
  return validate ? { ...validate, required: true } : undefined
}

export function getValidateRules(rule: FormCreateRule, state?: FormCreateFieldState): FormCreateValidateRule[] {
  const rules = [...(rule.validate || [])]
  const requiredRule = getRequiredRule(rule, state)
  if (requiredRule && !rules.some(item => item.required)) {
    rules.unshift(requiredRule)
  }
  return rules
}
