import { exec } from 'child_process'
import { EnvironmentPlugin } from 'webpack'
import ForkTsPlugin from 'fork-ts-checker-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import HtmlPlugin from 'html-webpack-plugin'
import HtmlIncAssetsPlugin from 'html-webpack-include-assets-plugin'
import HardSourcePlugin from 'hard-source-webpack-plugin'
import StylelintPlugin from 'stylelint-webpack-plugin'
import BuildNotifPlugin from 'webpack-build-notifier'
import CssExtractPlugin from 'mini-css-extract-plugin'
import SentryPlugin from '@sentry/webpack-plugin'
import ZipPlugin from 'zip-webpack-plugin'
import PostCompilePlugin from 'post-compile-webpack-plugin'
// Disabling this for now as it adds 2-4 seconds to inc. build time - look into finding out why
// import WebExtReloadPlugin from 'webpack-chrome-extension-reloader'

import initEnv from './env'
import * as staticFiles from './static-files'
import { output } from './config'

/**
 * @param {boolean} tslint Denotes whether or not to enable linting on this thread as well as type checking.
 */
const initTsPlugin = tslint =>
    new ForkTsPlugin({
        checkSyntacticErrors: true,
        async: false,
        tslint,
        // Hacky workaround for now as this plugin tries to lint imported TS node_modules for some reason
        // CI linting will still pick these up
        ignoreLints: ['class-name', 'no-shadowed-variable', 'comment-format'],
    })

export default function({
    webExtReloadPort = 9090,
    mode = 'development',
    template,
    notifsEnabled = false,
    isCI = false,
    shouldPackage = false,
    packagePath = '../dist',
    extPackageName = 'extension.zip',
    sourcePackageName = 'source-code.zip',
}) {
    const plugins = [
        new EnvironmentPlugin(initEnv({ mode })),
        new CopyPlugin(staticFiles.copyPatterns),
        new HtmlPlugin({
            title: 'Popup',
            chunks: ['popup'],
            filename: 'popup.html',
            template,
        }),
        new HtmlPlugin({
            title: 'Settings',
            chunks: ['options'],
            filename: 'options.html',
            template,
        }),
        new HtmlIncAssetsPlugin({
            append: false,
            assets: staticFiles.htmlAssets,
        }),
        new CssExtractPlugin({
            filename: '[name].css',
        }),
    ]

    if (mode === 'development') {
        plugins.push(
            new HardSourcePlugin(),
            // new WebExtReloadPlugin({
            //     port: webExtReloadPort,
            // }),
        )
    } else if (mode === 'production') {
        plugins.push(
            new SentryPlugin({
                release: process.env.npm_package_version,
                include: output.path,
                dryRun: true,
            }),
        )
    }

    // CI build doesn't need to use linting plugins
    if (isCI) {
        return [...plugins, initTsPlugin(false)]
    }

    if (notifsEnabled) {
        plugins.push(
            new BuildNotifPlugin({
                title: 'Memex Build',
            }),
        )
    }

    if (shouldPackage) {
        plugins.push(
            new ZipPlugin({
                path: packagePath,
                filename: extPackageName,
                exclude: [/\.map/],
            }),
            // TODO: do this in node
            new PostCompilePlugin(() => exec('sh package-source-code.sh')),
        )
    }

    return [
        ...plugins,
        initTsPlugin(true),
        new StylelintPlugin({
            files: 'src/**/*.css',
            failOnError: mode === 'production',
        }),
    ]
}
