// NOTE: Loader `include` paths are relative to this module
import path from 'path'

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

export const styleLoader = {
    loader: 'style-loader',
}

export const cssLoader = {
    loader: 'css-loader',
    options: {
        modules: true,
    },
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

export default ({ context, isCI = false }) => {
    const main = {
        test: /\.(j|t)sx?$/,
        include: path.resolve(context, './src'),
        use: [babelLoader, tsLoader],
    }

    const cssModules = {
        test: /\.css$/,
        include: path.resolve(context, './src'),
        use: [styleLoader, cssLoader, postcssLoader],
    }

    const cssVanilla = {
        test: /\.css$/,
        include: path.resolve(context, './node_modules'),
        use: [styleLoader, 'css-loader'],
    }

    const lint = {
        test: /\.jsx?$/,
        include: path.resolve(context, './src'),
        use: [eslintLoader],
    }

    if (isCI) {
        return [main, cssModules, cssVanilla]
    }

    main.use = [threadLoader, ...main.use]
    return [main, lint, cssModules, cssVanilla]
}
