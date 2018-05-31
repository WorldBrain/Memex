import path from 'path'
import * as loaders from '../build/loaders'

module.exports = (baseConfig, env, defaultConfig) => {
    defaultConfig.module.rules.push({
        test: /\.(j|t)sx?$/,
        include: path.resolve(__dirname, '../src'),
        use: [loaders.babelLoader, loaders.tsLoader],
    })

    defaultConfig.module.rules.push({
        test: /\.css$/,
        include: path.resolve(__dirname, '../src'),
        use: [
            loaders.styleLoader,
            loaders.cssModulesLoader,
            loaders.postcssLoader,
        ],
    })

    defaultConfig.module.rules.push({
        test: /\.css$/,
        include: path.resolve(__dirname, '../node_modules'),
        use: [loaders.styleLoader, loaders.cssVanillaLoader],
    })

    defaultConfig.resolve.alias.src = path.resolve(__dirname, '../src')

    return defaultConfig
}
