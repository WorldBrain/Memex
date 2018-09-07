import UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import CssAssetsPlugin from 'optimize-css-assets-webpack-plugin'

export default () => [
    new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
        uglifyOptions: {
            output: { ascii_only: true },
        },
    }),
    new CssAssetsPlugin({
        cssProcessorOptions: {
            autoprefixer: { disable: true },
            parser: require('postcss-safe-parser'),
            discardComments: {
                removeAll: true,
            },
        },
    }),
]
