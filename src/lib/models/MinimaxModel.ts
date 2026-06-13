import icon from '#root/assets/icons/minimax.svg?react'

import Model from './base/Model.ts'

export default class MinimaxModel extends Model {
  override name = 'MiniMax'
  override subname = 'M2.7'
  override getIcon() {
    return this.renderIcon(icon)
  }
}
