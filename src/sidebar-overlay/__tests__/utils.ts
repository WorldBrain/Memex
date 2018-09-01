/**
 * Gets the plugin converted classname of a given classname.
 * @param module Module of the source file
 * @param classname Class name given in the css
 */
export const getClassName = (module: string, classname: string): string =>
    `.Memex__${module}__${classname}`
