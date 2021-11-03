import { debug } from '@actions/core';
import { execSync } from 'child_process';

export function npmVersion(version: string) {
  debug(`NPM version ${version}...`);
  execSync(`npm --no-git-tag-version version ${version}`);
}

export function npmPublish() {
  debug(`NPM publish...`);
  execSync(`npm publish`);
}
