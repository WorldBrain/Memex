import { storiesOf } from '@storybook/react'
import * as knobs from '@storybook/addon-knobs'
import React from 'react'
import CommentBox from 'src/in-page-ui/sidebar/react/components/comment-box'

const stories = storiesOf('Sidebar - Comment Box', module)
stories.addDecorator(knobs.withKnobs)

stories.add('Random', () => (
    <CommentBox
        {...{
            env: 'inpage',
            isSocialPost: false,
            onSaveCb: () => {},
            highlighter: null as any,
            closeComments: () => {},
            anchor: { quote: 'Test', descriptor: null as any },
            commentText: '',
            tags: [],
            isCommentBookmarked: true,
            handleCommentTextChange: (comment: string) => {},
            saveComment: () => {},
            cancelComment: () => {},
            toggleBookmark: () => {},
        }}
    />
))
