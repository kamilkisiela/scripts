#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;

program
  .version(require('../package.json').version)
  .option('--tag', 'use dist-tag')
  .option('--stable', 'latest dist-tag')
  .option('--rc', 'next dist-tag')
  .option('--beta', 'next dist-tag')
  .description('Script to publish NPM module');

program.parse(process.argv);

let tag = 'latest';

if (program.tag) {
  tag = program.tag;
}

if (program.rc || program.beta) {
  tag = 'next';
}

if (program.stable) {
  tag = 'latest';
}

publish(tag);

function publish(tag) {
  const message = 'Start publishing';
  const currentPath = process.cwd();
  const packageFilename = path.join(currentPath, 'package.json');
  const package = require(packageFilename);

  msg(`${message} ${package.version}`);

  const scriptsConfig = package['k-scripts'];
  const publishConfig = scriptsConfig['publish'];
  const out = './k-publish/';

  msg('Creating empty npm-publish directory');
  execSync(`rm -rf ${out}`);
  execSync(`mkdir ${out}`);
  msg('Directory prepared');

  msg('Start copying files');
  // take care of files
  if (publishConfig.copy) {
    publishConfig.copy.forEach(input => {
      msg(`Copying ${input}`);
      execSync('cp -r ./' + input + ' ' + out);
    });
  }

  // move also package.json
  msg('Copying package.json');
  execSync('cp ./package.json ' + out);

  msg('Files copied');

  // take care of package.json
  msg('Preparing a clean package.json');

  if (publishConfig.remove) {
    publishConfig.remove.forEach(field => {
      delete package[field];
    });
  }

  if (publishConfig.set) {
    Object.keys(publishConfig.set).forEach(field => {
      package[field] = publishConfig.set[field];
    });
  }

  delete package['k-scripts'];

  msg('Modifying package.json');
  fs.writeFileSync(out + 'package.json', JSON.stringify(package, null, 2));

  msg('package.json ready');

  msg('Publishing to npm');
  msg(`Using tag ${tag}`);
  execSync(`cd ${out} && npm publish --tag ${tag} && git push --tags`);
  msg('Publishing done');

  msg('Cleaning up');
  execSync(`rm -rf ${out}`);

  msg('Completed');
}

function msg(text) {
  console.log(`[Publish] ${text}`);
}
