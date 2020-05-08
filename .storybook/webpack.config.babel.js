import { NormalModuleReplacementPlugin } from 'webpack'
import merge from 'webpack-merge'
import path from 'path'

import initConf from '../build'

export default merge(
    initConf({
        context: path.resolve(__dirname, '..'),
        mode: 'development',
        injectStyles: true,
    }),
    {
        plugins: [
            // Set up mock for WebExt APIs. Idea from:
            //   https://github.com/aeksco/react-typescript-web-extension-starter/blob/f62486ec8518eb5cf78687a2e658505fd528dc8a/.storybook/webpack.config.js
            new NormalModuleReplacementPlugin(
                /webextension-polyfill-ts/,
                resource => {
                    const absMockPath = path.resolve(
                        __dirname,
                        'mocks/webextension-polyfill-ts.js',
                    )

                    resource.request = path.relative(
                        resource.context,
                        absMockPath,
                    )
                },
            ),
        ],
    },
)
