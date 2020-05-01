import initConfig from './build'

export default (env = {}) => {
    const conf = initConfig({
        context: __dirname,
        mode: env.prod ? 'production' : 'development',
        notifsEnabled: !!env.notifs,
        isCI: !!env.ci,
        shouldPackage: !!env.package,
        runSentry: !!env.sentry,
    })

    return conf
}
