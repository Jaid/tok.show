// Resolves CSS modules to an identity class map so components can render outside Vite.
await Bun.plugin({
  name: 'test-sass-modules',
  setup(build) {
    build.onLoad({filter: /\.module\.sass$/}, async args => {
      const source = await Bun.file(args.path).text()
      const classNames = new Set(source.matchAll(/^\s*\.([A-Z_a-z][\w-]*)/gm).map(match => match[1]))
      return {
        contents: `export default ${JSON.stringify(Object.fromEntries(classNames.entries()))}`,
        loader: 'js',
      }
    })
  },
})
