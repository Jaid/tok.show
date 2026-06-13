import icon from '#root/assets/icons/gemini.svg?react'

import Model from './base/Model.ts'

export default class GemmaModel extends Model {
  override name = 'Gemma'
  override subname = '4 31B it'
  override getIcon() {
    return this.renderIcon(icon)
  }
}
