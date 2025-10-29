/* eslint-disable @typescript-eslint/no-explicit-any */
interface GitHubRepo {
  name: string;
  description: string;
  topics: string[];
  language: string;
  languages_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
}

interface GitHubLanguages {
  [key: string]: number;
}

interface GitHubUser {
  [x: string]: string;
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  company: string;
  location: string;
  blog: string;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
}

class GitHubApiService {
  private baseUrl = 'https://api.github.com';
  private owner = 'AnkanSaha';
  private repo = 'AxioDB';

  private async fetchFromGitHub<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AxioDB-Documentation'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GitHub API fetch error:', error);
      throw error;
    }
  }

  async getRepository(): Promise<GitHubRepo> {
    return this.fetchFromGitHub<GitHubRepo>(`/repos/${this.owner}/${this.repo}`);
  }

  async getLanguages(): Promise<GitHubLanguages> {
    return this.fetchFromGitHub<GitHubLanguages>(`/repos/${this.owner}/${this.repo}/languages`);
  }

  async getCommits(limit: number = 10): Promise<GitHubCommit[]> {
    return this.fetchFromGitHub<GitHubCommit[]>(`/repos/${this.owner}/${this.repo}/commits?per_page=${limit}`);
  }

  async getUser(username: string = this.owner): Promise<GitHubUser> {
    return this.fetchFromGitHub<GitHubUser>(`/users/${username}`);
  }

  async getContributors(): Promise<GitHubUser[]> {
    return this.fetchFromGitHub<GitHubUser[]>(`/repos/${this.owner}/${this.repo}/contributors`);
  }

  async getUserRepos(username: string = this.owner, type: 'all' | 'owner' | 'public' = 'public', sort: 'created' | 'updated' | 'pushed' | 'full_name' = 'updated', per_page: number = 30): Promise<GitHubRepo[]> {
    return this.fetchFromGitHub<GitHubRepo[]>(`/users/${username}/repos?type=${type}&sort=${sort}&per_page=${per_page}`);
  }

  async getUserEvents(username: string = this.owner, per_page: number = 30): Promise<any[]> {
    return this.fetchFromGitHub<any[]>(`/users/${username}/events/public?per_page=${per_page}`);
  }

  async getPinnedRepos(username: string = this.owner): Promise<GitHubRepo[]> {
    // GitHub doesn't have a direct API for pinned repos, so we'll use GraphQL-like approach
    // For now, we'll fallback to getting top starred repos as a substitute
    const repos = await this.getUserRepos(username, 'public', 'updated', 30);
    return repos.slice(0, 6).sort((a, b) => b.stargazers_count - a.stargazers_count);
  }

  async getOrgRepos(orgName: string, per_page: number = 30): Promise<GitHubRepo[]> {
    return this.fetchFromGitHub<GitHubRepo[]>(`/orgs/${orgName}/repos?per_page=${per_page}&sort=updated`);
  }

  async getNexoralRepos(): Promise<GitHubRepo[]> {
    const repos = await this.getOrgRepos('nexoral', 30);
    return repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
  }

  async searchUserRepos(username: string = this.owner, query?: string): Promise<{items: GitHubRepo[], total_count: number}> {
    const searchQuery = query ? `user:${username} ${query}` : `user:${username}`;
    return this.fetchFromGitHub<{items: GitHubRepo[], total_count: number}>(`/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc`);
  }

  async getUserStats(username: string = this.owner): Promise<{
    user: GitHubUser;
    repos: GitHubRepo[];
    totalStars: number;
    totalForks: number;
    languages: {[key: string]: number};
    recentActivity: any[];
  }> {
    const [user, repos, events] = await Promise.all([
      this.getUser(username),
      this.getUserRepos(username, 'public', 'updated', 100),
      this.getUserEvents(username, 10)
    ]);

    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

    // Get language stats from all repos
    const languagePromises = repos.slice(0, 20).map(repo => 
      this.fetchFromGitHub<GitHubLanguages>(repo.languages_url.replace('https://api.github.com', ''))
        .catch(() => ({}))
    );
    
    const languageResults = await Promise.all(languagePromises);
    const languages: {[key: string]: number} = {};
    
    languageResults.forEach(repoLanguages => {
      Object.entries(repoLanguages).forEach(([lang, bytes]) => {
        languages[lang] = (languages[lang] || 0) + bytes;
      });
    });

    return {
      user,
      repos,
      totalStars,
      totalForks,
      languages,
      recentActivity: events
    };
  }

  getBadgeUrl(type: 'npm' | 'github-actions' | 'socket' | 'stars' | 'forks'): string {
    switch (type) {
      case 'npm':
        return 'https://badge.fury.io/js/axiodb.svg';
      case 'github-actions':
        return `https://github.com/${this.owner}/${this.repo}/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main`;
      case 'socket':
        return 'https://socket.dev/api/badge/npm/package/axiodb';
      case 'stars':
        return `https://img.shields.io/github/stars/${this.owner}/${this.repo}?style=social`;
      case 'forks':
        return `https://img.shields.io/github/forks/${this.owner}/${this.repo}?style=social`;
      default:
        return '';
    }
  }

  getRepositoryUrl(): string {
    return `https://github.com/${this.owner}/${this.repo}`;
  }

  formatLanguages(languages: GitHubLanguages): Array<{ name: string; percentage: number; color: string }> {
    const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    
    const languageColors: { [key: string]: string } = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      C: '#555555',
      Go: '#00ADD8',
      Rust: '#dea584',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Shell: '#89e051',
      HTML: '#e34c26',
      CSS: '#1572B6',
      Dockerfile: '#384d54'
    };

    return Object.entries(languages)
      .map(([name, bytes]) => ({
        name,
        percentage: Math.round((bytes / total) * 100 * 10) / 10,
        color: languageColors[name] || '#6c757d'
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}y ago`;
  }
}

export const githubApi = new GitHubApiService();
export type { GitHubRepo, GitHubCommit, GitHubLanguages, GitHubUser };