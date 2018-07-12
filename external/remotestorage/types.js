/**
 * @class BaseClient.Types
 *
 * - Manages and validates types of remoteStorage objects, using JSON-LD and
 *   JSON Schema
 * - Adds schema declaration/validation methods to BaseClient instances.
 **/
var Types = {
    /**
     * <alias> -> <uri>
     */
    uris: {},

    /**
     * Contains schema objects of all types known to the BaseClient instance
     *
     * <uri> -> <schema>
     */
    schemas: {},

    /**
     * <uri> -> <alias>
     */
    aliases: {},

    /**
     * Called via public function BaseClient.declareType()
     *
     * @private
     */
    declare: function(moduleName, alias, uri, schema) {
        var fullAlias = moduleName + '/' + alias

        if (schema.extends) {
            var extendedAlias
            var parts = schema.extends.split('/')
            if (parts.length === 1) {
                extendedAlias = moduleName + '/' + parts.shift()
            } else {
                extendedAlias = parts.join('/')
            }
            var extendedUri = this.uris[extendedAlias]
            if (!extendedUri) {
                throw "Type '" +
                    fullAlias +
                    "' tries to extend unknown schema '" +
                    extendedAlias +
                    "'"
            }
            schema.extends = this.schemas[extendedUri]
        }

        this.uris[fullAlias] = uri
        this.aliases[uri] = fullAlias
        this.schemas[uri] = schema
    },

    resolveAlias: function(alias) {
        return this.uris[alias]
    },

    getSchema: function(uri) {
        return this.schemas[uri]
    },

    inScope: function(moduleName) {
        var ml = moduleName.length
        var schemas = {}
        for (var alias in this.uris) {
            if (alias.substr(0, ml + 1) === moduleName + '/') {
                var uri = this.uris[alias]
                schemas[uri] = this.schemas[uri]
            }
        }
        return schemas
    },
}

var SchemaNotFound = function(uri) {
    var error = new Error('Schema not found: ' + uri)
    error.name = 'SchemaNotFound'
    return error
}

SchemaNotFound.prototype = Error.prototype

Types.SchemaNotFound = SchemaNotFound

module.exports = Types
