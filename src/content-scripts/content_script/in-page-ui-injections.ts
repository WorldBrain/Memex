import { initInPageUIInjections } from 'src/search-injection/content_script'
import type { InPageUIInjectionsMain } from 'src/content-scripts/content_script/types'

export const main: InPageUIInjectionsMain = async (...options) => {
    initInPageUIInjections(...options)
}
