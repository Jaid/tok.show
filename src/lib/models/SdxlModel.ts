import Model from './base/Model.ts'
export default class SdxlModel extends Model {
override name = 'SDXL'
override subname = 'Base 1.0'
override get icon() {
return '/stability.svg'
}
}