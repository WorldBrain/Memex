.PHONY: all
all: build-prod package

.PHONY: build
build: node_modules
	npm run build

.PHONY: build-prod
build-prod: node_modules
	npm run build-prod

.PHONY: watch
watch:
	npm run watch

.PHONY: package
package:
	npm run package

# Just check if node_modules is present at all, to ease first time install.
node_modules:
	npm install
