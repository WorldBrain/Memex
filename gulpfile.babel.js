import fs from 'fs'
import { exec as nodeExec} from 'child_process'
import pify from 'pify'
import gulp from 'gulp'
import uglify from 'gulp-uglify'
import identity from 'gulp-identity'
import source from 'vinyl-source-stream'
import buffer from 'vinyl-buffer'
import browserify from 'browserify'
import watchify from 'watchify'
import babelify from 'babelify'
import envify from 'loose-envify/custom'
import eslint from 'gulp-eslint'
import uglifyify from 'uglifyify'
import path from 'path'
import cssModulesify from 'css-modulesify'
import cssnext from 'postcss-cssnext'

const exec = pify(nodeExec)


// === Tasks for building the source code; result is put into ./extension ===

const staticFiles = {
    'node_modules/webextension-polyfill/dist/browser-polyfill.js': 'extension/lib',
    'node_modules/pdfjs-dist/build/pdf.worker.min.js': 'extension/lib',
    'node_modules/semantic-ui-css/semantic.min.css': 'extension/lib/semantic-ui',
    'node_modules/semantic-ui-css/themes/**/*': 'extension/lib/semantic-ui/themes',
}

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
        entries: ['./src/overview/main.jsx'],
        output: 'overview.js',
        destination: './extension/overview',
        cssOutput: 'style.css',
    },
    {
        entries: ['./src/page-viewer/localpage.js'],
        output: 'localpage.js',
        destination: './extension/page-viewer',
    },
    {
        entries: ['./src/popup/popup.js'],
        output: 'popup.js',
        destination: './extension/popup',
    },
]

const browserifySettings = {
    debug: true,
    extensions: ['.jsx', '.css'],
    paths: ['.'],
}

function createBundle({entries, output, destination, cssOutput},
                      {watch = false, production = false}) {
    let b = watch
        ? watchify(browserify({...watchify.args, ...browserifySettings, entries}))
            .on('update', bundle)
        : browserify({...browserifySettings, entries})
    b.transform(babelify)
    b.transform(envify({
        NODE_ENV: production ? 'production' : 'development',
    }), {global: true})

    if (cssOutput) {
        b.plugin(cssModulesify, {
            global: true,
            output: path.join(destination, cssOutput),
            postcssBefore: [
                cssnext,
            ],
        })
    }

    if (production) {
        b.transform(uglifyify, {global: true})
    }

    function bundle() {
        let startTime = Date.now()
        b.bundle()
            .on('error', error => console.error(error.message))
            .pipe(source(output))
            .pipe(buffer())
            .pipe(production ? uglify({output: {ascii_only: true}}) : identity())
            .pipe(gulp.dest(destination))
            .on('end', () => {
                let time = (Date.now() - startTime) / 1000
                console.log(`Bundled ${output} in ${time}s.`)
            })
    }

    bundle()
}

gulp.task('copyStaticFiles', () => {
    for (let filename in staticFiles) {
        console.log(`Copying '${filename}' to '${staticFiles[filename]}'..`)
        gulp.src(filename)
            .pipe(gulp.dest(staticFiles[filename]))
    }
})

gulp.task('lint', () => {
    return gulp.src(['src/**/*.js', 'src/**/*.jsx'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.results(results => {
            console.log(`Total Errors: ${results.errorCount}`)
        }))
})

gulp.task('build-prod', ['copyStaticFiles', 'lint'], () => {
    sourceFiles.forEach(bundle => createBundle(bundle, {watch: false, production: true}))
})

gulp.task('build', ['copyStaticFiles', 'lint'], () => {
    sourceFiles.forEach(bundle => createBundle(bundle, {watch: false}))
})

gulp.task('build-watch', ['copyStaticFiles'], () => {
    sourceFiles.forEach(bundle => createBundle(bundle, {watch: true}))
})

gulp.task('lint-watch', ['lint'], () => {
    gulp.watch(['src/**/*.js', 'src/**/*.jsx'])
    .on('change', (file) => {
        return gulp.src(file.path)
        .pipe(eslint())
        .pipe(eslint.format())
    })
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

gulp.task('package-firefox', async () => {
    const filename = getFilename()
    const buildXpiCommand = `web-ext -s ./extension -a ./dist/firefox build`
    await exec(buildXpiCommand)
    // web-ext will have named the file ${filename}.zip. Change .zip to .xpi.
    await exec(`rename -f "s/\\.zip$/.xpi/" dist/firefox/${filename}.zip`)
})

gulp.task('package-chromium', async () => {
    const filename = getFilename()
    const buildCrxCommand = (
        `crx pack ./extension`
        + ` -o ./dist/chromium/${filename}.crx`
        + ` -p .chrome-extension-key.pem`
    )
    await exec(buildCrxCommand)
})

gulp.task('package', ['package-firefox', 'package-chromium'])
