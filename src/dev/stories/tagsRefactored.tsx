import { storiesOf } from '@storybook/react'
import React from 'react'
import TagPicker from 'src/tags/ui/TagPicker'
import TagRow from 'src/tags/ui/TagPicker/components/TagRow'
import TagList from 'src/tags/ui/TagPicker/components/TagList'

import { Tag } from 'src/tags/background/types'
const tags = [
    { name: 'abcde1', url: 'http://test1' },
    { name: 'abcde2', url: 'http://test2' },
] as Tag[]

storiesOf('Tags Refactored', module)
    .add('Tag Picker - All together', () => (
        <div>
            <TagPicker
                onUpdateTagSelection={() => null}
                queryTags={term => tags}
                loadSuggestions={() => []}
                url={''}
            />
        </div>
    ))

    .add('Tag List', () => (
        <div>
            <TagList tags={tags} />
        </div>
    ))

    .add('Tag Row', () => (
        <div>
            <TagRow url={''} name={'tag'} />
        </div>
    ))
