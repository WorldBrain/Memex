#!/usr/bin/env bash

repos_dir='external'
repos='storex memex-stemmer'

for path in $repos
do
  cd $repos_dir/$path
  npm -s i
  npm link
  cd -
done

cd $repos_dir/storex-backend-dexie
npm -s i 2> /dev/null  # Installs deps, but should fail the prepare script
for repo in $repos; do npm link $repo; done
npm -s run prepare

echo "SUCCESS: submodules setup"
