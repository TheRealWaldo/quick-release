import { replaceInFile } from 'replace-in-file';
import { debug } from '@actions/core';
import { npmVersion } from './npm-operations';

export async function bumpFiles(
  latestVersion: string,
  recommendedVersion: string,
  files: string[]
) {
  if (files && files.length) {
    debug(`Bumping version in ${files.length} files...`);
    if (files.includes('package.json')) {
      npmVersion(recommendedVersion);
    }
    const straightReplaceFiles = files.filter((file) => file !== 'package.json');
    if (straightReplaceFiles && straightReplaceFiles.length) {
      return replaceInFile({
        files: straightReplaceFiles,
        from: new RegExp(latestVersion, 'g'),
        to: recommendedVersion,
      });
    }
    return {};
  } else {
    debug(`No files to bump.`);
    return {};
  }
}
