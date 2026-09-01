import icon from '#root/assets/svgable/deepseek.shape.yml?svgable'

import Model from './base/Model.ts'

export default class DeepSeekModel extends Model {
  override icon = icon
  override initiallyVisible = true
  override name = 'DeepSeek'
  override subname = 'V4 Pro'
}
