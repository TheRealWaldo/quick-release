import { Octokit } from '@octokit/action';
import { OctokitOptions } from '@octokit/core/dist-types/types';
import { info } from '@actions/core';

export class githubOperations {
  octokit: Octokit;

  constructor(octokitOptions?: OctokitOptions) {
    this.octokit = new Octokit(octokitOptions);
  }

  public async checkIfOpenPullRequestExists(owner: string, repo: string, head: string) {
    const response = await this.octokit.pulls.list({
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

  public async createOrUpdatePullRequest(
    owner: string,
    repo: string,
    head: string,
    base: string,
    title: string,
    body: string
  ) {
    const pull_number = await this.checkIfOpenPullRequestExists(owner, repo, 'release');

    if (pull_number) {
      await this.octokit.pulls.update({
        owner,
        repo,
        pull_number,
        title,
        body,
      });
      info(`Updated #${pull_number}`);
      return pull_number;
    } else {
      const response = await this.octokit.pulls.create({
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

  public async release(owner: string, repo: string, tag_name: string, name: string, body: string) {
    const result = await this.octokit.repos.createRelease({
      owner,
      repo,
      name,
      body,
      tag_name,
    });
    return result;
  }

  public async addAssignees(
    owner: string,
    repo: string,
    issue_number: number,
    assignees: string[]
  ) {
    const result = await this.octokit.issues.addAssignees({
      owner,
      repo,
      issue_number,
      assignees,
    });
    return result;
  }
}
