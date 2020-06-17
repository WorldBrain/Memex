import initConfig from './build'

export default async (env = {}) => {
    const conf = await initConfig({
        context: __dirname,
        mode: env.prod ? 'production' : 'development',
        notifsEnabled: !!env.notifs,
        isCI: !!env.ci,
        shouldPackage: !!env.package,
        runSentry: !!env.sentry,
    })

    return conf
}
