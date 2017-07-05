# This Makefile just runs npm scripts defined in package.json, both so that
# people can use `npm run ...` if they prefer, and because npm conveniently
# expands $PATH for us to find and run tools we install (e.g. gulp).

MIN_NODE_VERSION = 6

NPM_ABSENT_MSG = "\n Please install Node/NPM (see https://nodejs.org) \n"
NODE_VERSION_MSG = "\n Please install/activate Node version ≥ v${MIN_NODE_VERSION} \n"
YARN_ABSENT_MSG = "\n Please install yarn (globally), e.g. run: npm install -g yarn \n"

.PHONY: all
all: check_requirements
	###
	### Fetching and installing dependencies.
	###
	yarn install

	###
	### Transpiling, bundling & minifying the extension source code.
	###
	npm run build-prod

	###
	### Packaging it for the browsers.
	###
	npm run package

.PHONY: check_requirements
check_requirements:
	### Checking availability of Node/NPM and yarn. ###
	command -v npm >/dev/null || { echo ${NPM_ABSENT_MSG}; exit 1; }
	test `node -p "process.versions.node.split('.')[0]"` -ge ${MIN_NODE_VERSION} || { echo ${NODE_VERSION_MSG}; exit 1; }
	command -v yarn >/dev/null || { echo ${YARN_ABSENT_MSG}; exit 1; }
