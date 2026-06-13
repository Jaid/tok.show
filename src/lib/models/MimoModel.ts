import icon from '#root/assets/icons/xiaomi.svg?react'

import Model from './base/Model.ts'

export default class MimoModel extends Model {
  override name = 'MiMo'
  override subname = 'V2.5 Pro'
  override getIcon() {
    return this.renderIcon(icon)
  }
}
