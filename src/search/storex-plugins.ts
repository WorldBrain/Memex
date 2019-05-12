import { AnnotationsListPlugin } from 'src/search/background/annots-list'
import { SocialSearchPlugin } from 'src/search/background/social-search'
import { PageUrlMapperPlugin } from 'src/search/background/page-url-mapper'

export const plugins = [
    new AnnotationsListPlugin(),
    new SocialSearchPlugin(),
    new PageUrlMapperPlugin(),
]
