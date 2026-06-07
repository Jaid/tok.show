import Model from './base/Model.ts'

export default class GlmModel extends Model {
  override name = 'GLM'
  override subname = '5.1'
  override get icon() {
    return '/zai.svg'
  }
}
