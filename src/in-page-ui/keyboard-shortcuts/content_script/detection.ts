import { getLocalStorage } from 'src/util/storage'
import type { BaseKeyboardShortcuts } from '../types'
import * as constants from '../constants'
import { shortcutStorageToState } from '../utils'

export async function getKeyboardShortcutsState(): Promise<
    BaseKeyboardShortcuts
> {
    const storage = await getLocalStorage(
        constants.KEYBOARDSHORTCUTS_STORAGE_NAME,
        constants.KEYBOARDSHORTCUTS_DEFAULT_STATE,
    )
    return shortcutStorageToState(storage)
}
