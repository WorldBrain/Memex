import TerserPlugin from 'terser-webpack-plugin'
// import UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import CssAssetsPlugin from 'optimize-css-assets-webpack-plugin'

export default () => [
    new TerserPlugin({
        // cache: true,
        parallel: true,
        minify: TerserPlugin.uglifyJsMinify,
        // sourceMap: true, // Must be set to true if using source-maps in production
        terserOptions: {
            output: { ascii_only: true },
            // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
        },
    }),
    // new UglifyJsPlugin({
    //     cache: true,
    //     parallel: true,
    //     sourceMap: true,
    //     uglifyOptions: {
    //         output: { ascii_only: true },
    //     },
    // }),
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
