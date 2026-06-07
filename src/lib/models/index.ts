import type {Constructor} from 'type-fest'
import type Model from './base/Model.ts'
import GptModel from './GptModel.ts'
import DeepSeekModel from './DeepSeekModel.ts'
import MimoModel from './MimoModel.ts'
import QwenModel from './QwenModel.ts'
import GemmaModel from './GemmaModel.ts'
import KimiModel from './KimiModel.ts'
import GlmModel from './GlmModel.ts'
import HyModel from './HyModel.ts'
import MinimaxModel from './MinimaxModel.ts'
import SdxlModel from './SdxlModel.ts'
import StepModel from './StepModel.ts'

const map = new Map<string, Model>()

const add = (id: string, ModelClass: Constructor<Model>) => {
  map.set(id, new ModelClass(id))
}

add('gpt', GptModel)
add('deepseek', DeepSeekModel)
add('mimo', MimoModel)
add('qwen', QwenModel)
add('gemma', GemmaModel)
add('kimi', KimiModel)
add('glm', GlmModel)
add('hy', HyModel)
add('minimax', MinimaxModel)
add('sdxl', SdxlModel)
add('step', StepModel)

export type {default as Model} from './base/Model.ts'
export type {TokenizationResult} from './base/Model.ts'
export default map
