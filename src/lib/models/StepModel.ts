import icon from '#root/assets/icons/stepfun.svg?react'

import Model from './base/Model.ts'

export default class StepModel extends Model {
  override name = 'Step'
  override subname = '3.7 Flash'
  override getIcon() {
    return this.renderIcon(icon)
  }
}
