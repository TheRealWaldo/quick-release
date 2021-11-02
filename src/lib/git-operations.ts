import { debug, warning } from '@actions/core';
import { execSync } from 'child_process';
import { rsort, valid } from 'semver';
import conventionalCommitsDetector from 'conventional-commits-detector';
export const DELIMITER = '-----EOC------';

// TODO: replace with operations from simple-git

export function setUpGit(gitUserName: string, gitUserEmail: string, remoteRepo: string) {
  debug(`Setting git user to ${gitUserName}`);
  execSync(`git config user.name ${gitUserName}`);

  debug(`Setting git email to ${gitUserEmail}`);
  execSync(`git config user.email "${gitUserEmail}"`);

  debug(`Setting git remote to ${remoteRepo}`);
  execSync(`git remote set-url origin ${remoteRepo}`);
}

export function remoteBranchExists(remoteRepo: string, branch: string) {
  debug(`Checking if ${branch} exists on ${remoteRepo}...`);
  return execSync(`git ls-remote --heads ${remoteRepo} ${branch}`).toString() !== '';
}

export function createBranch(branch: string) {
  debug(`Checking out ${branch}...`);
  execSync(`git checkout -b ${branch}`);
}

export function getLatestCommitMessage() {
  debug(`Getting commit messages...`);
  return execSync(
    `git log -1 --format=%B%n-hash-%n%H%n-gitTags-%n%d%n-committerDate-%n%ci%n --no-merges`
  ).toString('utf-8');
}

export function getCommitMessages(from: string, to: string) {
  debug(`Getting commit messages...`);
  return execSync(
    `git log ${from}${
      from ? '..' : ''
    }${to} --format=%B%n-hash-%n%H%n-gitTags-%n%d%n-committerDate-%n%ci%n${DELIMITER} --no-merges`
  )
    .toString('utf-8')
    .split(`${DELIMITER}\n`)
    .map((commit) => commit.trim())
    .filter((commit) => commit !== '');
}

export function getLatestVersionFromTags(tagPrefix: string) {
  debug('Getting list of tags from git...');
  const tags = execSync(`git tag`).toString('utf-8').trim().split(/\r?\n/);
  debug(`tags found: ${tags}`);

  const versions = tags.filter((tag) => valid(tag));
  debug(`versions found: ${versions}`);

  const sortedVersions = rsort(versions);
  debug(`sorted versions: ${sortedVersions}`);

  if (!sortedVersions || !sortedVersions.length) {
    warning(`No version tags found.  Assuming ${tagPrefix}0.0.0.`);
    return `${tagPrefix}0.0.0`;
  } else {
    debug(`Latest version: ${sortedVersions[0]}`);
    return sortedVersions[0];
  }
}

export function detectConvention() {
  debug('Getting list of last 30 commits...');
  const commitMessages = execSync(`git log -n 30 --format=%B${DELIMITER} --no-merges`)
    .toString('utf-8')
    .split(`${DELIMITER}\n`)
    .map((commit) => commit.trim())
    .filter((commit) => commit !== '');

  const convention = conventionalCommitsDetector(commitMessages);
  debug(`detected convention: ${convention}`);
  return convention;
}
