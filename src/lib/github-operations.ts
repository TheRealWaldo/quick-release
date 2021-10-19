import { Octokit } from '@octokit/action';
import { info } from '@actions/core';

const octokit = new Octokit();

export async function checkIfOpenPullRequestExists(owner: string, repo: string, head: string) {
  const response = await octokit.pulls.list({
    owner,
    repo,
    head: owner.concat(':', head),
    state: 'open',
  });
  if (response.data.length > 0) {
    return response.data[0].number;
  }
  return undefined;
}

export async function createOrUpdatePullRequest(
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string
) {
  const pull_number = await checkIfOpenPullRequestExists(owner, repo, 'release');

  if (pull_number) {
    await octokit.pulls.update({
      owner,
      repo,
      pull_number,
      title,
      body,
    });
    info(`Updated #${pull_number}`);
    return pull_number;
  } else {
    const response = await octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base,
      // TODO: Allow for draft?
    });

    info(`Created #${response.data.number}`);
    return response.data.number;
  }
}

export async function addAssignees(
  owner: string,
  repo: string,
  issue_number: number,
  assignees: string[]
) {
  const result = await octokit.issues.addAssignees({
    owner,
    repo,
    issue_number,
    assignees,
  });
  return result;
}
