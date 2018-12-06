export class MemoryLocalStorage {
    private items = {}
    private changes = []

    setItem(key: string, value) {
        this.changes.push({ type: 'set', key, value })
        this.items[key] = value
    }

    getItem(key: string) {
        return this.items[key]
    }

    removeItem(key: string) {
        this.changes.push({ type: 'remove', key })
        delete this.items[key]
    }

    popChanges() {
        const changes = this.changes
        this.changes = []
        return changes
    }
}
