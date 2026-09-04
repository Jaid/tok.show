type Example = {
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
    title: 'quick brown fox and friends',
  },
  {
    id: 'typescript',
    title: 'TypeScript',
  },
  {
    id: 'unicode',
    title: 'Unicode',
  },
  {
    id: 'fast_inverse_square_root',
    title: 'fast inverse square root',
  },
  {
    id: 'mit',
    title: 'MIT license',
  },
  {
    id: 'html',
    title: 'view-source:example.com',
  },
] satisfies Array<ExampleMetadata>

export const examples: Array<Example> = exampleMetadata.map(example => ({
  ...example,
  text: getAssetText(example.id),
}))
