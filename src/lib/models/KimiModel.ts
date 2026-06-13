import icon from '#root/assets/icons/kimi.svg?react'

import Model from './base/Model.ts'

export default class KimiModel extends Model {
  override name = 'Kimi'
  override subname = 'K2.7-Coder'
  override getIcon() {
    return this.renderIcon(icon)
  }
}
