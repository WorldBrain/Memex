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
    { from: 'node_modules/pdfjs-dist/build/pdf.worker.min.js', to: 'lib/' },
    { from: 'node_modules/pdfjs-dist/build/pdf.min.js', to: 'lib/' },
    { from: 'node_modules/pdfjs-dist/web/pdf_viewer.css', to: 'lib/' },
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
    {
        from: 'src/pdf-viewer/app/index.{html,js,css}',
        to: './pdf-viewer.[ext]',
    },
]
