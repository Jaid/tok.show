import icon from '#root/assets/icons/stability.svg?react'

import Model from './base/Model.ts'

export default class SdxlModel extends Model {
  override name = 'SDXL'
  override subname = 'Base 1.0'
  override getIcon() {
    return this.renderIcon(icon)
  }
}
