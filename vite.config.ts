import type {ConfigEnv, UserConfig, UserConfigFn} from 'vite'

import babelPlugin from '@rolldown/plugin-babel'
import reactPlugin, {reactCompilerPreset} from '@vitejs/plugin-react'
import postcssAutoprefixer from 'autoprefixer'
import cssnano from 'cssnano-preset-advanced'
import postcssNormalize from 'postcss-normalize'
import {mergeConfig} from 'vite'
import mediaMixinsPlugin from 'vite-plugin-media-mixins'
import titlePlugin from 'vite-plugin-title'

const getCommonConfig = () => {
  const config: UserConfig = {
    build: {target: 'chrome147'},
    plugins: [titlePlugin(), reactPlugin(), babelPlugin({presets: [reactCompilerPreset()]}), mediaMixinsPlugin()],
    css: {postcss: {plugins: [postcssNormalize() as any, postcssAutoprefixer]}},
  }
  return config
}
const getDevelopmentConfig = (context: ConfigEnv) => {
  const config: UserConfig = {build: {outDir: `out/build/${context.mode}`}}
  return config
}
const getProductionConfig = () => {
  const cssnanoPlugins = cssnano().plugins.map(([createPlugin, options]) => createPlugin(options))
  const config: UserConfig = {
    server: {
      allowedHosts: true,
      host: '0.0.0.0',
    },
    build: {
      assetsDir: '',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2_000_000,
      minify: 'terser',
      rolldownOptions: {
        preserveEntrySignatures: false,
        treeshake: {propertyReadSideEffects: false},
        optimization: {
          inlineConst: {
            mode: 'all',
            pass: 100,
          },
        },
        output: {
          minify: true,
          topLevelVar: true,
          chunkFileNames: chunkInfo => {
            if (chunkInfo.name === 'rolldown-runtime') {
              return 'runtime.js'
            }
            return '[name].js'
          },
          assetFileNames: chunkInfo => {
            if (chunkInfo.names[0] === 'index.css') {
              return 'style.css'
            }
            return '[name].[ext]'
          },
          entryFileNames: 'main.js',
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /\/node_modules\/react(-dom)?\//,
                priority: 2,
              }, {
                name: 'vendor',
                test: /node_modules/,
                priority: 1,
              }, {name: 'main'},
            ],
          },
        },
        checks: {pluginTimings: false},
      },
    },
    css: {postcss: {plugins: cssnanoPlugins}},
  }
  return config
}
const commonConfig = getCommonConfig()
const config: UserConfigFn = context => mergeConfig(commonConfig, (context.mode === 'production' ? getProductionConfig : getDevelopmentConfig)(context))
export default config
