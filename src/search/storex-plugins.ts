import { AnnotationsSearchPlugin } from 'src/search/background/annots-search'
import { AnnotationsListPlugin } from 'src/search/background/annots-list'
import { PageUrlMapperPlugin } from 'src/search/background/page-url-mapper'

export const plugins = [
    new AnnotationsSearchPlugin(),
    new AnnotationsListPlugin(),
    new PageUrlMapperPlugin(),
]
