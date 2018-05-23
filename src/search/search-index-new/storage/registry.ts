export default class StorageRegistry {
    public collections = {}
    public collectionsByVersion = {}

    registerCollection(name, defs) {
        if (!(defs instanceof Array)) {
            defs = [defs]
        }

        defs.sort(def => def.version.getTime()).forEach(def => {
            this.collections[name] = def
            def.name = name

            const indices = def.indices || []
            indices.forEach(fieldName => {
                def.fields[fieldName]._index = true
            })

            const version = def.version.getTime()
            this.collectionsByVersion[version] = this.collectionsByVersion[version] || []
            this.collectionsByVersion[version].push(def)
        })
    }
}
