/**
 * Everything in here gets injected into the generated HTML as link/script tags.
 * See: https://github.com/jharris4/html-webpack-include-assets-plugin#example
 */
export const htmlAssets = [
    'fonts/material-icons/material-icons.css',
    'fonts/googlefonts/lato.css',
    'fonts/googlefonts/open-sans.css',
    'fonts/googlefonts/libre-franklin.css',
    'lib/browser-polyfill.js',
    'style/slick.css',
    'style/slick-theme.css',
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
    {
        from: 'fonts/*/*',
        to: 'fonts/googlefonts/[name].[ext]',
    },
    {
        from:
            'node_modules/material-design-icons/iconfont/*.{eot,ttf,woff,woff2,css}',
        to: 'fonts/material-icons/[name].[ext]',
        toType: 'template',
    },
    { from: 'node_modules/slick-carousel/slick/slick.css', to: 'style/' },
    { from: 'src/style/slick-theme.css', to: 'style/' },
]
