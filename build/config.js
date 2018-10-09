import path from 'path'

import initLoaderRules from './loaders'
import initPlugins from './plugins'
import initMinimizers from './minimizers'

export const extensions = ['.ts', '.tsx', '.js', '.jsx', '.coffee']

export const entry = {
    background: './src/background.ts',
    popup: './src/popup/index.tsx',
    content_script: './src/content_script.js',
    options: './src/options/options.jsx',
    sidebar: './src/sidebar-overlay/sidebar.js',
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
                : 'hidden-source-map',
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
                storex: path.resolve(context, './external/storex'),
                'storex-backend-dexie': path.resolve(
                    context,
                    './external/storex-backend-dexie',
                ),
                'memex-stemmer': path.resolve(
                    context,
                    './external/memex-stemmer',
                ),
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
