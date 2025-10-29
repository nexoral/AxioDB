import React, { useEffect, useState } from 'react';
import { GitBranch, Star, GitFork, Calendar, ExternalLink, User, Code2 } from 'lucide-react';
import { githubApi, GitHubRepo, GitHubCommit, GitHubLanguages, GitHubUser } from '../../services/githubApi';

const GitHubActivity: React.FC = () => {
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [languages, setLanguages] = useState<GitHubLanguages>({});
  const [maintainer, setMaintainer] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        setLoading(true);
        const [repoData, commitsData, languagesData, maintainerData] = await Promise.all([
          githubApi.getRepository(),
          githubApi.getCommits(8),
          githubApi.getLanguages(),
          githubApi.getUser()
        ]);

        setRepo(repoData);
        setCommits(commitsData);
        setLanguages(languagesData);
        setMaintainer(maintainerData);
      } catch (err) {
        setError('Failed to fetch GitHub data');
        console.error('GitHub API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 mb-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 mb-8">
        <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
      </div>
    );
  }

  const formattedLanguages = githubApi.formatLanguages(languages);

  return (
    <div className="space-y-8 mb-16">
      {/* Repository Stats */}
      {repo && (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-600 rounded-xl">
              <GitBranch className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Live Repository Stats</h3>
              <p className="text-slate-600 dark:text-slate-400">Real-time data from GitHub</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-700 rounded-xl p-4 text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{repo.stargazers_count}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Stars</div>
            </div>
            
            <div className="bg-white dark:bg-slate-700 rounded-xl p-4 text-center">
              <GitFork className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{repo.forks_count}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Forks</div>
            </div>

            <div className="bg-white dark:bg-slate-700 rounded-xl p-4 text-center">
              <ExternalLink className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{repo.open_issues_count}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Open Issues</div>
            </div>

            <div className="bg-white dark:bg-slate-700 rounded-xl p-4 text-center">
              <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {githubApi.formatRelativeTime(repo.updated_at)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Last Update</div>
            </div>
          </div>

          <div className="mt-6">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-800 dark:bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </div>
      )}

      {/* Tech Stack */}
      {formattedLanguages.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-600 rounded-xl">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tech Stack</h3>
              <p className="text-slate-600 dark:text-slate-400">Languages used in the repository</p>
            </div>
          </div>

          <div className="space-y-4">
            {formattedLanguages.slice(0, 5).map((lang) => (
              <div key={lang.name} className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: lang.color }}
                  ></div>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{lang.name}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${lang.percentage}%`, 
                        backgroundColor: lang.color 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400 min-w-0">
                    {lang.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintainer Profile */}
      {maintainer && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-600 rounded-xl">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Project Maintainer</h3>
              <p className="text-slate-600 dark:text-slate-400">Meet the creator of AxioDB</p>
            </div>
          </div>

          <div className="flex items-start gap-6">
            <img
              src={maintainer.avatar_url}
              alt={maintainer.name}
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
            />
            <div className="flex-1">
              <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                {maintainer.name}
              </h4>
              <p className="text-purple-600 dark:text-purple-400 mb-2">@{maintainer.login}</p>
              {maintainer.bio && (
                <p className="text-slate-600 dark:text-slate-400 mb-3">{maintainer.bio}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>{maintainer.public_repos} repositories</span>
                <span>{maintainer.followers} followers</span>
                {maintainer.location && <span>📍 {maintainer.location}</span>}
              </div>
              <div className="mt-4">
                <a
                  href={maintainer.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View GitHub Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {commits.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-orange-600 rounded-xl">
              <GitBranch className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Recent Activity</h3>
              <p className="text-slate-600 dark:text-slate-400">Latest commits from the repository</p>
            </div>
          </div>

          <div className="space-y-4">
            {commits.slice(0, 5).map((commit) => (
              <div key={commit.sha} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                {commit.author && (
                  <img
                    src={commit.author.avatar_url}
                    alt={commit.author.login}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 dark:text-slate-100 font-medium line-clamp-2">
                    {commit.commit.message.split('\n')[0]}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
                    <span>{commit.commit.author.name}</span>
                    <span>•</span>
                    <span>{githubApi.formatRelativeTime(commit.commit.author.date)}</span>
                    <span>•</span>
                    <a
                      href={commit.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {commit.sha.substring(0, 7)}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <a
              href={`${githubApi.getRepositoryUrl()}/commits`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View All Commits
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubActivity;