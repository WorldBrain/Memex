import path from 'path'

import initLoaderRules from './loaders'
import initPlugins from './plugins'
import initMinimizers from './minimizers'

export const extensions = ['.ts', '.tsx', '.js', '.jsx', '.coffee']

export const entry = {
    background: './src/background-entry.js',
    popup: './src/popup/popup.js',
    content_script: './src/content_script.js',
    options: './src/options/options.jsx',
}

export const htmlTemplate = path.resolve(__dirname, './template.html')

export const output = {
    path: path.resolve(__dirname, '../extension'),
    filename: '[name].js',
}

export default ({ context = __dirname, mode = 'development', ...opts }) => {
    const conf = {
        context,
        entry,
        output,
        mode,
        devtool:
            mode === 'development'
                ? 'inline-cheap-module-source-map'
                : 'source-map',
        plugins: initPlugins({
            ...opts,
            mode,
            template: htmlTemplate,
        }),
        module: {
            rules: initLoaderRules({ ...opts, mode, context }),
        },
        resolve: {
            extensions,
            symlinks: false,
            mainFields: ['browser', 'main', 'module'],
            alias: {
                src: path.resolve(context, './src'),
            },
        },
        stats: {
            assetsSort: 'size',
            children: false,
            cached: false,
            cachedAssets: false,
            entrypoints: false,
            excludeAssets: /\.(png|svg)/,
            maxModules: 5,
        },
        performance: {
            hints: false,
        },
    }

    if (mode === 'production') {
        conf.optimization = {
            minimizer: initMinimizers(),
        }
    }

    // CI doesn't need source-maps
    if (opts.isCI) {
        delete conf.devtool
    }

    return conf
}
