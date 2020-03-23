import { storiesOf } from '@storybook/react'
import React from 'react'
import TagPicker from 'src/tags/ui/TagPicker'
import TagRow from 'src/tags/ui/TagPicker/components/TagRow'
import TagList from 'src/tags/ui/TagPicker/components/TagResultsList'

import { Tag } from 'src/tags/background/types'
const tags = [
    { name: 'initial', url: 'http://test2a' },
    { name: 'tag', url: 'http://test2b' },
    { name: 'abcde1', url: 'http://test1c' },
    { name: 'abcde2', url: 'http://test2d' },
    { name: 'tag 1', url: 'http://test2e' },
    { name: 'tag 2', url: 'http://test2f' },
] as Tag[]

storiesOf('Tags Refactored', module)
    .add('Tag Picker - All together', () => (
        <div>
            <TagPicker
                onUpdateTagSelection={() => null}
                queryTags={async term =>
                    tags.filter(t => t.name.includes(term))
                }
                loadSuggestions={() => [tags[4], tags[5]]}
                url={''}
                initialSelectedTags={[tags[0], tags[1]]}
            />
        </div>
    ))

    .add('Tag List', () => (
        <div>
            <TagList tags={tags} onPress={t => null} />
        </div>
    ))

    .add('Tag Row', () => (
        <div>
            <TagRow url={''} name={'tag'} />
        </div>
    ))
