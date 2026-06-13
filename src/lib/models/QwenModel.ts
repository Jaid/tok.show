import icon from '#root/assets/icons/qwen.svg?react'

import Model from './base/Model.ts'

export default class QwenModel extends Model {
  override name = 'Qwen'
  override subname = '3.6 27B'
  override getIcon() {
    return this.renderIcon(icon)
  }
}
