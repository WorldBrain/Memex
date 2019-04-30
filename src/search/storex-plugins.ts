import { AnnotationsListPlugin } from 'src/search/background/annots-list'
import { TweetsSearchPlugin } from 'src/search/background/tweets-search'
import { PageUrlMapperPlugin } from 'src/search/background/page-url-mapper'

export const plugins = [
    new AnnotationsListPlugin(),
    new TweetsSearchPlugin(),
    new PageUrlMapperPlugin(),
]
