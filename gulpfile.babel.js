import 'core-js/fn/object/entries' // shim Object.entries
import fs from 'fs'
import { exec as nodeExec } from 'child_process'
import pify from 'pify'
import streamToPromise from 'stream-to-promise'
import gulp from 'gulp'
import zip from 'gulp-zip'
import composeUglify from 'gulp-uglify/composer'
import identity from 'gulp-identity'
import source from 'vinyl-source-stream'
import buffer from 'vinyl-buffer'
import stylelint from 'gulp-stylelint'
import browserify from 'browserify'
import gulpSeq from 'gulp-sequence'
import watchify from 'watchify'
import babelify from 'babelify'
import envify from 'loose-envify/custom'
import eslint from 'gulp-eslint'
import path from 'path'
import cssModulesify from 'css-modulesify'
import cssnext from 'postcss-cssnext'
import * as chromeStore from 'chrome-store-api'
const signAddon = require('sign-addon').default;

const exec = pify(nodeExec)

// === Tasks for building the source code; result is put into ./extension ===

const staticFiles = {
    'src/manifest.json': 'extension',
    'src/update/*': 'extension/update',
    'src/**/*.html': 'extension',
    'img/*': 'extension/img',
    'node_modules/webextension-polyfill/dist/browser-polyfill.js':
        'extension/lib',
    'node_modules/slick-carousel/slick/slick.min.js': 'extension/lib',
    'node_modules/pdfjs-dist/build/pdf.worker.min.js': 'extension/lib',
    'node_modules/material-design-icons/iconfont/*.{eot,ttf,woff,woff2,css}':
        'extension/fonts/material-icons',
    'node_modules/slick-carousel/slick/slick.css': 'extension/style/',
    'src/style/*.css': 'extension/style/',
}

const commonUIEntry = './src/common-ui/components/index.js'

const sourceFiles = [
    {
        entries: ['./src/background.js'],
        output: 'background.js',
        destination: './extension',
    },
    {
        entries: ['./src/content_script.js'],
        output: 'content_script.js',
        destination: './extension',
    },
    {
        entries: ['./src/overview/overview.jsx', commonUIEntry],
        output: 'overview.js',
        destination: './extension/overview',
        cssOutput: 'overview.css',
    },
    {
        entries: ['./src/options/options.jsx', commonUIEntry],
        output: 'options.js',
        destination: './extension/options',
        cssOutput: 'options.css',
    },
    {
        entries: ['./src/popup/popup.js', commonUIEntry],
        output: 'popup.js',
        destination: './extension/popup',
        cssOutput: 'popup.css',
    },
]

const browserifySettings = {
    debug: true,
    extensions: ['.jsx', '.css'],
    paths: ['.'],
}

// Set up `gulp-uglify` to work with `uglify-es` (ES6 support)
const uglify = composeUglify(require('uglify-es'), console)

async function createBundle(
    { entries, output, destination, cssOutput },
    { watch = false, production = false },
) {
    const b = watch
        ? watchify(
            browserify({ ...watchify.args, ...browserifySettings, entries }),
        ).on('update', bundle)
        : browserify({ ...browserifySettings, entries })
    b.transform(babelify)
    b.transform(
        envify({
            NODE_ENV: production ? 'production' : 'development',
            PIWIK_HOST: production
                ? 'https://analytics.worldbrain.io'
                : 'http://localhost:1234',
            PIWIK_SITE_ID: '1',
        }),
        { global: true },
    )

    if (cssOutput) {
        b.plugin(cssModulesify, {
            global: true,
            output: path.join(destination, cssOutput),
            postcssBefore: [cssnext],
        })
    }

    function bundle(callback) {
        const startTime = Date.now()
        b
            .bundle()
            .on('error', err => {
                console.error(err.stack)
                // Fail entire gulp build if browserify emits error, but not in dev/watch mode
                if (!watch) {
                    process.exit(1)
                }
            })
            .pipe(source(output))
            .pipe(buffer())
            .pipe(
            production
                ? uglify({
                    output: { ascii_only: true },
                })
                : identity(),
        )
            .pipe(gulp.dest(destination))
            .on('end', () => {
                const time = (Date.now() - startTime) / 1000
                console.log(`Bundled ${output} in ${time}s.`)
                if (!watch) {
                    callback()
                }
            })
    }

    await pify(bundle)()
}

gulp.task('propagateVersionNumber', () => {
    // Copies version number from package.json to manifest.json and maybe other places in the future
    const version = getVersion()
    const manifest = JSON.parse(fs.readFileSync('./src/manifest.json'))
    manifest.version = version
    fs.writeFileSync('./src/manifest.json', JSON.stringify(manifest, null, 4))
})

gulp.task('copyStaticFiles', ['propagateVersionNumber'], () => {
    for (const filename in staticFiles) {
        console.log(`Copying '${filename}' to '${staticFiles[filename]}'..`)
        gulp.src(filename).pipe(gulp.dest(staticFiles[filename]))
    }
})

gulp.task('copyStaticFiles-watch', ['copyStaticFiles'], () => {
    Object.entries(staticFiles).forEach(([filename, destination]) => {
        gulp.watch(filename).on('change', event => {
            console.log(`Copying '${filename}' to '${staticFiles[filename]}'..`)
            return gulp.src(filename).pipe(gulp.dest(staticFiles[filename]))
        })
    })
})

gulp.task('build-prod', ['copyStaticFiles'], async () => {
    const ps = sourceFiles.map(bundle =>
        createBundle(bundle, { watch: false, production: true }),
    )
    await Promise.all(ps)
})

gulp.task('build', ['copyStaticFiles'], async () => {
    const ps = sourceFiles.map(bundle => createBundle(bundle, { watch: false }))
    await Promise.all(ps)
})

gulp.task('build-watch', ['copyStaticFiles-watch'], async () => {
    const ps = sourceFiles.map(bundle => createBundle(bundle, { watch: true }))
    await Promise.all(ps)
})

// === Tasks for linting the source code ===

const stylelintOptions = {
    reporters: [{ formatter: 'string', console: true }],
}

gulp.task('lint', async () => {
    const failLintError = process.argv.slice(-1)[0] !== 'watch'

    let eslintStream = gulp
        .src(['src/**/*.js', 'src/**/*.jsx'])
        .pipe(eslint())
        .pipe(eslint.format())
    if (failLintError) {
        eslintStream = eslintStream.pipe(eslint.failAfterError())
    }
    eslintStream = eslintStream.pipe(
        eslint.results(results => {
            // For clarity, also give some output when there are no errors.
            if (results.errorCount === 0) {
                console.log(`No eslint errors.\n`)
            }
        }),
    )
    await streamToPromise(eslintStream)

    const stylelintStream = gulp
        .src(['src/**/*.css'])
        .pipe(
        stylelint({
            ...stylelintOptions,
            failAfterError: failLintError,
        }),
    )
        .on('error', e => {
            console.error(e)
            process.exit(1)
        })
    await streamToPromise(stylelintStream)
})

gulp.task('lint-watch', ['lint'], callback => {
    gulp.watch(['src/**/*.js', 'src/**/*.jsx']).on('change', event => {
        return gulp
            .src(event.path)
            .pipe(eslint())
            .pipe(eslint.format())
    })

    gulp.watch(['src/**/*.css']).on('change', event => {
        return gulp.src(event.path).pipe(stylelint(stylelintOptions))
    })

    // Don't call callback, to wait forever.
})

gulp.task('watch', ['build-watch', 'lint-watch'])

// === Tasks for packaging the extension; results go into ./dist/{browser} ===

function getManifest() {
    const manifest = JSON.parse(fs.readFileSync('./extension/manifest.json'))
    return manifest
}

function getFilename() {
    const { name, version } = getManifest()
    const filename = `${name.toLowerCase()}-${version}`
    return filename
}

function getVersion() {
    const pkgInfo = JSON.parse(fs.readFileSync('./package.json'))
    return pkgInfo.version
}

gulp.task('package-source-code', () =>
    gulp
        .src(
        [
            '**/*',
            '!.git/**',
            '!node_modules/**',
            '!dist/**',
            '!extension/**',
        ],
        {
            dot: true,
        },
    )
        .pipe(zip('source-code.zip'))
        .pipe(gulp.dest('dist')),
)

gulp.task('package-extension', () =>
    gulp
        .src('extension/**/*')
        .pipe(zip('extension.zip'))
        .pipe(gulp.dest('dist')),
)

gulp.task(
    'package',
    gulpSeq('build-prod', ['package-source-code', 'package-extension']),
)

// Tasks for publishing the extension

gulp.task('publish-extension:chrome', ['package-extension'], async () => {
    const extensionID = process.env.WEBSTORE_EXTENSION_ID
    const tokenManager = new chromeStore.TokenManager(
        process.env.WEBSTORE_TOKEN_CODE,
        process.env.WEBSTORE_CLIENT_ID,
        process.env.WEBSTORE_CLIENT_SECRET,
    )
    const api = new chromeStore.Webstore(tokenManager)
    const zip = await new Promise((resolve, reject) => {
        fs.readFile(
            'dist/extension.zip',
            (err, data) => (err ? reject(err) : resolve(data)),
        )
    })
    await api.update(extensionID, zip)
    await api.publish(extensionID, process.env.WEBSTORE_PUBLISH_TARGET)
})

gulp.task('publish-extension:firefox', ['package-extension'], () => {
    return signAddon({
        xpiPath: 'dist/extension.zip',
        version: JSON.parse(fs.readFileSync('package.json')).version,
        apiKey: process.env.AMO_API_KEY,
        apiSecret: process.env.AMO_API_SECRET,
        channel: 'listed',
        downloadDir: 'downloaded_amo',
    }).then(function (result) {
        if (result.success) {
            console.log("The following signed files were downloaded:");
            console.log(result.downloadedFiles);
            console.log("Your extension ID is:");
            console.log(result.id);
        } else {
            console.error("Your add-on could not be signed!");
            console.error("Check the console for details.");
        }
        console.log(result.success ? "SUCCESS" : "FAIL");
    }).catch(function (error) {
        console.error("Signing error:", error);
    })
})

gulp.task('publish-extension', ['publish-extension:chrome'])

/* DEPRECATED */
gulp.task('package-firefox-old', async () => {
    const filename = getFilename()
    const buildXpiCommand = `web-ext -s ./extension -a ./dist/firefox build`
    await exec(buildXpiCommand)
    // web-ext will have named the file ${filename}.zip. Change .zip to .xpi.
    await exec(`mv dist/firefox/${filename}.zip dist/firefox/${filename}.xpi`)
})

/* DEPRECATED */
gulp.task('package-chromium-old', async () => {
    const filename = getFilename()
    const buildCrxCommand =
        `crx pack ./extension` +
        ` -o ./dist/chromium/${filename}.crx` +
        ` -p .chrome-extension-key.pem`
    // crx fails if the output directory is not there.
    await exec(`mkdir -p dist/chromium`)
    await exec(buildCrxCommand)
})
