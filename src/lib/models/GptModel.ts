import icon from '#root/assets/svgable/gpt.shape.yml?svgable'

import Model from './base/Model.ts'

export default class GptModel extends Model {
  override icon = icon
  override initiallyVisible = true
}
