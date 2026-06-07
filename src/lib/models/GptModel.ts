import Model from './base/Model.ts'
export default class GptModel extends Model {
override name = 'GPT'
override subname = '5.5'
override get icon() {
return '/openai.svg'
}
override initiallyVisible = true
}