import Model from './base/Model.ts'

export default class HyModel extends Model {
  override name = 'Hy'
  override subname = '3 Preview'
  override get icon() {
    return '/hunyuan.svg'
  }
}
