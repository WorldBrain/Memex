import type Dexie from 'dexie'
import { showDirectoryPicker } from 'native-file-system-adapter'
import { exportDB, ExportOptions } from 'dexie-export-import'

export interface Dependencies {
    db: Dexie
    progressCallback: ExportOptions['progressCallback']
}

type FileHandle = any

async function getDumpFile(): Promise<FileHandle> {
    const dirHandle = await showDirectoryPicker()

    if ((await dirHandle.requestPermission({ writable: true })) !== 'granted') {
        throw new Error('FS access was denied by user')
    }

    return dirHandle.getFileHandle('memex-db-dump', {
        create: true,
    })
}

async function writeToDumpFile(
    fileHandle: FileHandle,
    dbContents: Blob,
): Promise<void> {
    const writable = await fileHandle.createWritable()
    await dbContents.stream().pipeTo(writable)
    await writable.close()
}

export async function dumpDB({
    db,
    progressCallback,
}: Dependencies): Promise<void> {
    const dumpFile = await getDumpFile()
    const dbContentsBlob = await exportDB(db, {
        noTransaction: true,
        progressCallback,
    })

    await writeToDumpFile(dumpFile, dbContentsBlob)
}
