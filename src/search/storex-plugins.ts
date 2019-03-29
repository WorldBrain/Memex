import {
    DexieUtilsPlugin,
    SearchLookbacksPlugin,
    SuggestPlugin,
    BackupPlugin,
} from 'src/search/plugins'
import { AnnotationsListPlugin } from 'src/search/background/annots-list'
import { SocialSearchPlugin } from 'src/search/background/social-search'
import { PageUrlMapperPlugin } from 'src/search/background/page-url-mapper'

export const plugins = [
    new SocialSearchPlugin(),
    new BackupPlugin(),
    new AnnotationsListPlugin(),
    new PageUrlMapperPlugin(),
    new SuggestPlugin(),
    new DexieUtilsPlugin(),
    new SearchLookbacksPlugin(),
]
