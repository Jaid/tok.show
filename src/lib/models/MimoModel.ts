import Model from './base/Model.ts'

export default class MimoModel extends Model {
  override name = 'MiMo'
  override subname = 'V2.5 Pro'
  override get icon() {
    return '/xiaomi.svg'
  }
}
