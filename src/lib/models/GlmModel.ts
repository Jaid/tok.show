import icon from '#root/assets/icons/zai.svg?react'

import Model from './base/Model.ts'

export default class GlmModel extends Model {
  override name = 'GLM'
  override subname = '5.1'
  override getIcon() {
    return this.renderIcon(icon)
  }
}
