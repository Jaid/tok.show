import icon from '#root/assets/icons/deepseek.svg?react'

import Model from './base/Model.ts'

export default class DeepSeekModel extends Model {
  override initiallyVisible = true
  override name = 'DeepSeek'
  override subname = 'V4 Pro'
  override getIcon() {
    return this.renderIcon(icon)
  }
}
