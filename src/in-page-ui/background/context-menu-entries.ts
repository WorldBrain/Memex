import { Menus } from 'webextension-polyfill-ts'

export const ID_PREFIX = '@memexContextMenu:'

export const CREATE_HIGHLIGHT: Menus.CreateCreatePropertiesType = {
    id: ID_PREFIX + 'createHighlight',
    title: 'Create a highlight on selected text',
    contexts: ['selection'],
}

export const CREATE_ANNOTATION: Menus.CreateCreatePropertiesType = {
    id: ID_PREFIX + 'createAnnotation',
    title: 'Create an annotation on selected text',
    contexts: ['selection'],
}
