import expect from 'expect'

import parseNetscape from './netscape-parser'
// import { bookmarkOS, diigo, googleBookmarks, instapaper, pinboard, raindrop, pocket, } from './bookmark-exports.test.data'
import {
    raindrop,
    pinboard,
    instapaper,
    pocket,
    googleBookmarks,
    bookmarkOS,
    diigo,
} from './bookmark-exports.test.data'

// const sources = [ bookmarkOS, diigo, googleBookmarks, instapaper, pinboard, raindrop, pocket, ]

const importSource = (source) => {
    // TODO: Fix this test
    it.skip('should import correctly', () => {
        return
        const parser = new DOMParser()
        const htmlDoc = parser.parseFromString(source['input'], 'text/html')
        const output = JSON.parse(source['output']).map((item) => {
            // remove timeAdded bc it is set to Date.now() if not present in the htmlDoc
            const { timeAdded, ...itemSimplified } = item
            return itemSimplified
        })
        const parsed = parseNetscape(htmlDoc)
        expect(parsed).toMatchObject(output)
    })
}
describe('import from different sources', () => {
    describe('pinboard', () => importSource(pinboard))
    describe('raindrop', () => importSource(raindrop))
    describe('instapaper', () => importSource(instapaper))
    describe('pocket', () => importSource(pocket))
    describe('googleBookmarks', () => importSource(googleBookmarks))
    describe('bookmarkOS', () => importSource(bookmarkOS))
    describe('diigo', () => importSource(diigo))
})
