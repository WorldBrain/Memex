// NOTE: Loader `include` paths are relative to this module
import path from 'path'
import CssExtractPlugin from 'mini-css-extract-plugin'

export const threadLoader = {
    loader: 'thread-loader',
    options: {
        poolTimeout: Infinity, // Threads won't timeout/need to be restarted on inc. builds
        workers: require('os').cpus().length - 1,
    },
}

export const eslintLoader = {
    loader: 'eslint-loader',
    options: {
        cache: true,
    },
}

export const babelLoader = {
    loader: 'babel-loader',
}

export const tsLoader = {
    loader: 'ts-loader',
    options: {
        happyPackMode: true,
    },
}

export const injectStylesLoader = {
    loader: 'style-loader',
}

export const extractStylesLoader = {
    loader: CssExtractPlugin.loader,
}

export const cssModulesLoader = {
    loader: 'css-loader',
    options: {
        modules: true,
        importLoaders: 1,
    },
}

export const cssVanillaLoader = {
    loader: 'css-loader',
}

export const postcssLoader = {
    loader: 'postcss-loader',
}

export const imgLoader = {
    test: /\.(png|jpg|gif)$/,
    include: path.resolve(__dirname, '../img'),
    use: [
        {
            loader: 'url-loader',
            options: {
                limit: 8192,
            },
        },
    ],
}

export const svgLoader = {
    test: /\.svg$/,
    include: /node_modules/, // Only resolve SVG imports from node_modules (imported CSS) - for now
    loader: 'svg-inline-loader',
}

export default ({ mode, context, isCI = false, injectStyles = false }) => {
    // style-loader's general method of inserting <style> tags into the `document` doesn't
    //  seem to play nicely with the content_script. It would be nice to find a work-around
    //  later as style-loader is nicer for dev.
    const styleLoader = injectStyles ? injectStylesLoader : extractStylesLoader

    const main = {
        test: /\.(j|t)sx?$/,
        include: path.resolve(context, './src'),
        use: [babelLoader, tsLoader],
    }

    const cssModules = {
        test: /\.css$/,
        include: path.resolve(context, './src'),
        use: [styleLoader, cssModulesLoader, postcssLoader],
    }

    const cssVanilla = {
        test: /\.css$/,
        include: path.resolve(context, './node_modules'),
        use: [styleLoader, cssVanillaLoader],
    }

    const lint = {
        test: /\.jsx?$/,
        include: path.resolve(context, './src'),
        use: [eslintLoader],
    }

    if (isCI) {
        return [main, cssModules, cssVanilla]
    }

    if (mode !== 'production') {
        main.use = [threadLoader, ...main.use]
    }

    return [main, lint, cssModules, cssVanilla]
}
