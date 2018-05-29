import initConfig from './build'

export default (env = {}) => {
    const conf = initConfig({
        context: __dirname,
        mode: env.prod ? 'production' : 'development',
        notifsEnabled: !!env.notifs,
        isCI: !!env.ci,
    })

    // CI doesn't need source-maps
    if (env.ci) {
        delete conf.devtool
    }

    return conf
}
