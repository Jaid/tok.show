import Model from './base/Model.ts'
export default class StepModel extends Model {
override name = 'Step'
override subname = '3.7 Flash'
override get icon() {
return '/stepfun.svg'
}
}