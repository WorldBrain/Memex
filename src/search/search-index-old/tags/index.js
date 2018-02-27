import { makeIndexFnConcSafe } from '../util'
import { setTags as setDef, addTag as addDef } from './add'
import { delTag as delDef } from './del'

// Augment a bunch of methods by placing them on the index queue first
const setTags = makeIndexFnConcSafe(setDef)
const addTag = makeIndexFnConcSafe(addDef)
const delTag = makeIndexFnConcSafe(delDef)

export { default as suggestTags, fetchTags } from './suggest'
export { setTags, addTag, delTag }
