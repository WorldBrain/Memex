import { makeIndexFnConcSafe } from '../util'
import { setTags as setDef, addTags as addDef } from './add'
import { delTags as delDef } from './del'

// Augment a bunch of methods by placing them on the index queue first
const setTags = makeIndexFnConcSafe(setDef)
const addTags = makeIndexFnConcSafe(addDef)
const delTags = makeIndexFnConcSafe(delDef)

export { default as suggestTags, fetchTags } from './suggest'
export { setTags, addTags, delTags }
