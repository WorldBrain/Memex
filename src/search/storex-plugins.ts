import { AnnotationsSearchPlugin } from 'src/search/background/annots-search'
import { PageUrlMapperPlugin } from 'src/search/background/page-url-mapper'

export const plugins = [
    new AnnotationsSearchPlugin(),
    new PageUrlMapperPlugin(),
]
