import icon from '#root/assets/icons/gemini.svg'

import Model from './base/Model.ts'

export default class GemmaModel extends Model {
  override icon = icon
  override name = 'Gemma'
  override subname = '4 31B it'
}
