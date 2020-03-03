import { storiesOf } from '@storybook/react'
import React from 'react'
import TagPicker from 'src/tags/ui/TagPicker'
import { Tag } from 'src/tags/background/types'
const tags = [
    { name: 'abcde1', url: 'http://test1' },
    { name: 'abcde2', url: 'http://test2' },
] as Tag[]

storiesOf('Tags', module).add('Tag Picker - test', () => (
    <div>
        <TagPicker
            onUpdateTagSelection={() => null}
            queryTags={term => tags}
            loadSuggestions={() => []}
            url={''}
        />
    </div>
))
