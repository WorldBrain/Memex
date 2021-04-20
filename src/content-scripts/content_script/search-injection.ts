import { initSearchInjection } from 'src/search-injection/content_script'
import { SearchInjectionMain } from 'src/content-scripts/content_script/types'

export const main: SearchInjectionMain = async (options) => {
    initSearchInjection(options)
}
