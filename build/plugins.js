import { exec } from 'child_process'
import { EnvironmentPlugin } from 'webpack'
import ForkTsPlugin from 'fork-ts-checker-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import HtmlPlugin from 'html-webpack-plugin'
var HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin')
import StylelintPlugin from 'stylelint-webpack-plugin'
import BuildNotifPlugin from 'webpack-build-notifier'
import CssExtractPlugin from 'mini-css-extract-plugin'
import SentryPlugin from '@sentry/webpack-plugin'
import ZipPlugin from 'zip-webpack-plugin'
import PostCompilePlugin from 'post-compile-webpack-plugin'
import initEnv from './env'
import * as staticFiles from './static-files'
import { output } from './config'
const Dotenv = require('dotenv-webpack')

/**
 * @param {boolean} tslint Denotes whether or not to enable linting on this thread as well as type checking.
 */
const initTsPlugin = (tslint) =>
    new ForkTsPlugin({
        checkSyntacticErrors: true,
        async: false,
        tslint,
    })

export default function ({
    webExtReloadPort = 9090,
    mode = 'development',
    htmlTemplates,
    isCI = false,
    runSentry = false,
    notifsEnabled = false,
    shouldPackage = false,
    packagePath = '../dist',
    extPackageName = 'extension.zip',
    sourcePackageName = 'source-code.zip',
}) {
    const { defaultEnv, envPath } = initEnv({ mode })

    const plugins = [
        new EnvironmentPlugin(defaultEnv),
        new Dotenv({ path: envPath }),
        new CopyPlugin(staticFiles.copyPatterns),
        new CssExtractPlugin({
            filename: '[name].css',
        }),
        new HtmlPlugin({
            title: 'Popup',
            chunks: ['popup'],
            filename: 'popup.html',
            template: htmlTemplates.popup,
        }),
        new HtmlPlugin({
            title: 'Memex',
            chunks: ['options'],
            filename: 'options.html',
            template: htmlTemplates.options,
        }),
        new HtmlWebpackTagsPlugin({
            append: false,
            tags: staticFiles.htmlAssets,
        }),
    ]

    if (mode === 'development') {
        // FIXME: Webpack 5 does not need / is not compatible with this plugin.
        // is there any config here to update webpack with?
        //
        // plugins.push(
        //     new HardSourcePlugin({
        //         environmentHash: {
        //             root: process.cwd(),
        //             directories: [],
        //             files: [
        //                 'yarn.lock',
        //                 'package-lock.json',
        //                 'private/.env.example',
        //                 'private/.env.production',
        //                 'private/.env.development',
        //             ],
        //         },
        //     }),
        // )
    } else if (mode === 'production') {
        plugins.push(
            new SentryPlugin({
                release: process.env.npm_package_version,
                include: output.path,
                dryRun: !runSentry,
                debug: true,
            }),
        )
    }

    if (shouldPackage || isCI) {
        plugins.push(
            new ZipPlugin({
                path: packagePath,
                filename: extPackageName,
                exclude: [/\.map/],
            }),
        )
    }

    if (shouldPackage) {
        plugins.push(
            new PostCompilePlugin(() =>
                exec('git-archive-all dist/source-code.zip'),
            ),
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

    return [
        ...plugins,
        initTsPlugin(true),
        new StylelintPlugin({
            files: 'src/**/*.css',
            failOnError: mode === 'production',
        }),
    ]
}
