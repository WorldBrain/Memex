// FIXME webpack 5, I wonder if these are actually needed now?
/**
 * Everything in here gets injected into the generated HTML as link/script tags.
 * See: https://github.com/jharris4/html-webpack-include-assets-plugin#example
 */
export const htmlAssets = [
    'fonts/Inter/inter.css',
    'fonts/Poppins/poppins.css',
    'lib/browser-polyfill.js',
]

/**
 * Set the manifest version to be equal to `package.json` version.
 */
function transformManifestVersion(content) {
    const manifest = JSON.parse(content.toString())
    manifest.version = process.env.npm_package_version
    return Buffer.from(JSON.stringify(manifest))
}

function transformViewer(content) {
    let viewer = content.toString()
    viewer = viewer.replace(
        'HOSTED_VIEWER_ORIGINS.includes(viewerOrigin)',
        'true',
    )

    // FIXME: This is a hack for now, as the GH Pages branch we get the viewer from only ever has the latest build
    //  do we build our own versions of the viewer and the pdf.js app so they always match?
    // yeah probably need our own 'dist' package that is spit out, which includes the web viewer in the bundle
    viewer = viewer.replace(
        "viewerVersion = '2.8.18'",
        "viewerVersion = '2.7.570'",
    )
    return Buffer.from(viewer)
}
function transformViewerHTML(content) {
    let viewer = content.toString()
    viewer = viewer.replace('../build/pdf.js', './build/pdf.js')
    viewer = viewer.replace(
        '</body>',
        `
       <script src="../lib/browser-polyfill.js"></script>
        <script src="../content_script.js"></script>
 </body>`,
    )
    return Buffer.from(viewer)
}
/**
 * Everything in here gets copied as-is to the output dir.
 * See: https://github.com/webpack-contrib/copy-webpack-plugin#usage
 */
export const copyPatterns = [
    {
        from: 'src/manifest.json',
        to: '.',
        transform: transformManifestVersion,
    },
    { from: 'img', to: 'img' },
    {
        from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js',
        to: 'lib/',
    },

    {
        from: 'fonts/*/*',
        to: 'fonts/[name].[ext]',
    },
    {
        from: 'fonts/Inter/*',
        to: 'fonts/Inter/[name].[ext]',
    },
    {
        from: 'fonts/Poppins/*',
        to: 'fonts/Poppins/[name].[ext]',
    },
    {
        from:
            'node_modules/material-design-icons/iconfont/*.{eot,ttf,woff,woff2,css}',
        to: 'fonts/material-icons/[name].[ext]',
        toType: 'template',
    },
    // { from: 'node_modules/pdfjs-dist/build/pdf.worker.min.js', to: 'lib/' },
    // { from: 'node_modules/pdfjs-dist/build/pdf.worker.min.js', to: 'build/pdf.worker.js' },
    //
    // { from: 'node_modules/pdfjs-dist/web/pdf_viewer.css', to: 'lib/' },
    // { from: 'node_modules/pdfjs-dist/web/pdf_viewer.js', to: 'lib/' },
    // { from: 'node_modules/pdfjs-dist/build/pdf.js', to: 'lib/' },

    //
    {
        from: 'node_modules/pdfjs-dist/web/pdf_viewer.css',
        to: 'pdfjs/viewer.css',
    },
    {
        from: 'node_modules/pdfjs-dist/web/pdf_viewer.js',
        to: 'pdfjs/viewer.js',
    },
    // {
    //     from: 'node_modules/pdfjs-dist-web/web/images/*.*',
    //     to: 'pdfjs/images/[name].[ext]',
    // },
    // {
    //     from: 'node_modules/pdfjs-dist-web/web/viewer.js',
    //     to: 'pdfjs/viewer.js',
    //     transform: transformViewer,
    // },    {
    //     from: 'node_modules/pdfjs-dist-web/web/viewer.html',
    //     to: 'pdfjs/viewer.html',
    //     transform: transformViewerHTML,
    // },
    // {
    //     from: 'node_modules/pdfjs-dist/build/*',
    //     to: 'pdfjs/build/[name].[ext]',
    // },
    //  {
    //      from: 'node_modules/pdfjs-dist/build/pdf.worker.js',
    //      to: 'lib/' },
    //  {
    //      from: 'node_modules/pdfjs-dist/build/pdf.worker.js',
    //      to: 'build/pdf.worker.js' },
    // {
    //     from: 'node_modules/pdfjs-dist-web/web/images.*',
    //     to: 'pdfjs/images/[name].[ext]',
    // },
    // {
    //     from: 'node_modules/pdfjs-dist-web/web/locale/locale.properties',
    //     to: 'pdfjs/locale/locale.properties',
    // },
    // {
    //     from: 'node_modules/pdfjs-dist-web/web/locale/en-US/viewer.properties',
    //     to: 'pdfjs/locale/en-US/viewer.properties',
    // },
]
