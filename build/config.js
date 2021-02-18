import path from 'path'

import initLoaderRules from './loaders'
import initPlugins from './plugins'
import initMinimizers from './minimizers'
import { externalTsModules } from './external'

export const extensions = ['.ts', '.tsx', '.js', '.jsx']

export const entry = {
    background: './src/background.ts',
    popup: './src/popup/index.tsx',
    content_script: './src/content-scripts/content_script/global_webpage.ts',
    content_script_pdfjs:
        './src/content-scripts/content_script/global_pdfjs.ts',
    content_script_search_injection:
        './src/content-scripts/content_script/search-injection.ts',
    content_script_ribbon: './src/content-scripts/content_script/ribbon.ts',
    content_script_tooltip: './src/content-scripts/content_script/tooltip.ts',
    content_script_sidebar: './src/content-scripts/content_script/sidebar.ts',
    options: './src/options/options.jsx',
}

export const output = {
    path: path.resolve(__dirname, '../extension'),
    filename: '[name].js',
}

export default ({ context = __dirname, mode = 'development', ...opts }) => {
    const aliases = {
        src: path.resolve(context, './src'),
    }

    for (const [moduleAlias, modulePath] of Object.entries(externalTsModules)) {
        const extPath = path.resolve(context, `./external/${modulePath}/ts`)
        Object.assign(aliases, {
            [`${moduleAlias}$`]: extPath,
            [`${moduleAlias}/lib`]: extPath,
        })
    }

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
            htmlTemplates: {
                options: path.resolve(__dirname, './template-options.html'),
                popup: path.resolve(__dirname, './template-popup.html'),
            },
        }),
        module: {
            rules: initLoaderRules({ ...opts, mode, context }),
        },
        resolve: {
            extensions,
            symlinks: false,
            mainFields: ['browser', 'main', 'module'],
            alias: aliases,
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

    return conf
}
