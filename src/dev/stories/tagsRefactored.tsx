import { storiesOf } from '@storybook/react'
import React from 'react'
import { action } from '@storybook/addon-actions'
import TagPicker from 'src/tags/ui/TagPicker'
import TagRow from 'src/tags/ui/TagPicker/components/TagRow'
import TagList from 'src/tags/ui/TagPicker/components/TagResultsList'
import { withGlobalStyles } from 'src/dev/stories/decorators'

const tags = ['initial', 'tag', 'abcde1', 'abcde2', 'tag 1', 'tag 2']

storiesOf('Tags Refactored', module)
    .addDecorator(withGlobalStyles)
    .add('Tag Picker - All together, Default theme', () => (
        <div>
            <TagPicker
                onUpdateTagSelection={selectedTags => action('updatedTags')}
                queryTags={async term => tags.filter(t => t.includes(term))}
                loadDefaultSuggestions={() => [tags[4], tags[5]]}
                url={''}
                initialSelectedTags={async () => [tags[0], tags[1]]}
            />
        </div>
    ))

    .add('Tag List', () => {
        let i = 0
        return (
            <div>
                <TagList
                    tags={tags.map(t => ({
                        name: t,
                        selected: false,
                        focused: false,
                        index: i++,
                    }))}
                    onPress={t => null}
                    onFocus={t => null}
                />
            </div>
        )
    })

    .add('Tag Row', () => (
        <div>
            <TagRow name={'tag'} selected={false} index={1} />
        </div>
    ))
