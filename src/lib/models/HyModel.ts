import icon from '#root/assets/icons/hunyuan.svg?react'

import Model from './base/Model.ts'

export default class HyModel extends Model {
  override name = 'Hy'
  override subname = '3 Preview'
  override getIcon() {
    return this.renderIcon(icon)
  }
}
