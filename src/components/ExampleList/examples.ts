type Example = {
  description: string
  id: string
  text: string
  title: string
}

type ExampleMetadata = Omit<Example, 'text'>

const assets: Partial<Record<string, string>> = import.meta.glob<string>('./assets/*.txt', {
  eager: true,
  import: 'default',
  query: '?raw',
})
const getAssetText = (id: string) => {
  const text = assets[`./assets/${id}.txt`]
  if (text === undefined) {
    throw new Error(`Missing example asset: ${id}.txt`)
  }
  return text
}
const exampleMetadata = [
  {
    id: 'quick_brown_fox',
    title: 'Quick brown fox',
    description: 'A short English pangram.',
  },
  {
    id: 'typescript',
    title: 'TypeScript',
    description: 'Modern code and identifiers.',
  },
  {
    id: 'unicode',
    title: 'Unicode sampler',
    description: 'Multiple scripts, emoji and combining marks.',
  },
  {
    id: 'fast_inverse_square_root',
    title: 'Quake III',
    description: 'The fast inverse square root implementation.',
  },
  {
    id: 'mit',
    title: 'MIT license',
    description: 'The complete license text for this project.',
  },
] satisfies Array<ExampleMetadata>

export const examples: Array<Example> = exampleMetadata.map(example => ({
  ...example,
  text: getAssetText(example.id),
}))
