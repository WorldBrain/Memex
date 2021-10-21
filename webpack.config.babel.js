import initConfig from './build'

var HardSourceWebpackPlugin = require('hard-source-webpack-plugin')

export default (env = {}) => {
    const conf = initConfig({
        context: __dirname,
        mode: env.prod ? 'production' : 'development',
        notifsEnabled: !!env.notifs,
        isCI: !!env.ci,
        shouldPackage: !!env.package,
        runSentry: !!env.sentry,
        plugins: [
            new HardSourceWebpackPlugin(),
            new HardSourceWebpackPlugin.ExcludeModulePlugin([
                // ... settings
            ]),
        ],
    })

    return conf
}
