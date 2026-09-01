import icon from '#root/assets/icons/qwen.svg'

import Model from './base/Model.ts'

export default class QwenModel extends Model {
  override icon = icon
  override name = 'Qwen'
  override subname = '3.6 27B'
}
