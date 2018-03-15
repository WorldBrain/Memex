import 'babel-polyfill'
import fs from 'fs'
import gulp from 'gulp'
import zip from 'gulp-zip'
import streamToPromise from 'stream-to-promise'
import composeUglify from 'gulp-uglify/composer'
import identity from 'gulp-identity'
import source from 'vinyl-source-stream'
import buffer from 'vinyl-buffer'
import stylelint from 'gulp-stylelint'
import browserify from 'browserify'
import gulpSeq from 'gulp-sequence'
import watchify from 'watchify'
import babelify from 'babelify'
import tsify from 'tsify'
import envify from 'loose-envify/custom'
import eslint from 'gulp-eslint'
import path from 'path'
import cssModulesify from 'css-modulesify'
import cssnext from 'postcss-cssnext'

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
        entries: ['./src/background-entry.js'],
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

function createBundle(
    { entries, output, destination, cssOutput },
    { watch = false, production = false },
) {
    const b = watch
        ? watchify(
              browserify({ ...watchify.args, ...browserifySettings, entries }),
          ).on('update', bundle)
        : browserify({ ...browserifySettings, entries })
    b.plugin(tsify, { target: 'es5' })
    b.transform(babelify, { extensions: ['.js', '.jsx', '.ts', '.tsx'] })
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

    function bundle() {
        return new Promise((resolve, reject) => {
            const startTime = Date.now()
            b
                .bundle()
                .on('error', err => {
                    console.error('ERROR creating bundle', err)
                    console.error(err.stack)
                    // Fail entire gulp build if browserify emits error, but not in dev/watch mode
                    if (!watch) {
                        reject(err)
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
                        resolve()
                    }
                })
        })
    }
    return bundle()
}

gulp.task('copyStaticFiles', () => {
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

gulp.task('build-prod', ['copyStaticFiles'], () =>
    Promise.all(
        sourceFiles.map(bundle =>
            createBundle(bundle, { watch: false, production: true }),
        ),
    ),
)

gulp.task('build', ['copyStaticFiles'], () =>
    Promise.all(
        sourceFiles.map(bundle => createBundle(bundle, { watch: false })),
    ),
)

gulp.task('build-watch', ['copyStaticFiles-watch'], () =>
    Promise.all(
        sourceFiles.map(bundle => createBundle(bundle, { watch: true })),
    ),
)

// === Tasks for linting the source code ===

const stylelintOptions = {
    reporters: [{ formatter: 'string', console: true }],
}

gulp.task('lint', () => {
    const failLintError = process.argv.slice(-1)[0] !== 'watch'

    // Run eslint stream
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

    return streamToPromise(eslintStream).then(() => {
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
        return streamToPromise(stylelintStream)
    })
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
