import icon from '#root/assets/icons/meta.svg'

import Model from './base/Model.ts'

export default class MuseModel extends Model {
  override icon = icon
  // Muse Wonder shares its tokenizer with the open-weight Muse Spark Open that token-vocabs ships
  override get title() {
    return 'Muse Wonder 1.0'
  }
}
