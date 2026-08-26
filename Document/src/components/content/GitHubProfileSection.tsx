import React, { useEffect, useState } from 'react';
import { 
  FaGithub, 
  FaStar, 
  FaCodeBranch, 
  FaCalendarAlt, 
  FaSpinner,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { githubApi, GitHubRepo, GitHubUser } from '../../services/githubApi';

interface GitHubStats {
  user: GitHubUser;
  repos: GitHubRepo[];
  totalStars: number;
  totalForks: number;
  pinnedRepos: GitHubRepo[];
}

const GitHubProfileSection: React.FC = () => {
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGitHubStats = async () => {
      try {
        setLoading(true);
        const [user, nexoralRepos] = await Promise.all([
          githubApi.getUser(),
          githubApi.getNexoralRepos()
        ]);

        const totalStars = nexoralRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const totalForks = nexoralRepos.reduce((sum, repo) => sum + repo.forks_count, 0);
        const pinnedRepos = nexoralRepos.slice(0, 6); // Show top 6 repos

        setGithubStats({
          user,
          repos: nexoralRepos,
          totalStars,
          totalForks,
          pinnedRepos
        });
      } catch (err) {
        setError('Failed to fetch GitHub data');
        console.error('GitHub API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubStats();
  }, []);


  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 shadow-lg border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="animate-spin text-4xl text-accent-600" />
          <span className="ml-3 text-lg text-gray-600">Loading GitHub data...</span>
        </div>
      </div>
    );
  }

  if (error || !githubStats) {
    return (
      <div className="bg-red-100/20 border border-red-800 rounded-lg p-8">
        <p className="text-red-400 text-center">{error || 'Failed to load GitHub data'}</p>
      </div>
    );
  }

  const { user, repos, totalStars, totalForks, pinnedRepos } = githubStats;

  return (
    <div className="space-y-8">
      {/* Enhanced Profile Header */}
      <div className="bg-white border border-gray-200 text-gray-900 rounded-lg shadow-sm overflow-hidden">
        <div className="relative p-5 sm:p-8 lg:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-100/40 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
            <div className="relative">
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-32 h-32 rounded-xl border-4 border-accent-400/50 shadow-md"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                <span className="text-xs">🟢</span>
              </div>
            </div>
            
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                <FaGithub className="text-3xl" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-accent-600">
                  {user.name}
                </h2>
              </div>
              
              <p className="text-xl text-gray-600 mb-4">@{user.login}</p>
              
              {user.bio && (
                <p className="text-lg text-gray-600 leading-relaxed mb-6 max-w-2xl">
                  {user.bio}
                </p>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{repos.length}</div>
                  <div className="text-sm text-gray-600">Repositories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{totalStars}</div>
                  <div className="text-sm text-gray-600">Total Stars</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-600">{totalForks}</div>
                  <div className="text-sm text-gray-600">Total Forks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{user.followers}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 justify-center lg:justify-start">
                <FaCalendarAlt />
                <span>Joined GitHub on {formatDate(user.created_at)}</span>
              </div>
              
              <a
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                <FaGithub />
                View Full GitHub Profile
                <FaExternalLinkAlt className="text-sm" />
              </a>
            </div>
          </div>
        </div>
      </div>


      {/* Pinned Repositories */}
      <div className="bg-gray-100 rounded-lg p-8 shadow-lg border border-gray-200">
        <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
          <FaStar className="text-yellow-500" />
          Featured Repositories
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pinnedRepos.map((repo) => (
            <div key={repo.name} className="bg-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 border hover:border-accent-600">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-gray-900 text-lg truncate">
                  {repo.name}
                </h4>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-accent-600 transition-colors"
                >
                  <FaExternalLinkAlt className="text-sm" />
                </a>
              </div>

              {repo.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {repo.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-accent-500"></div>
                    {repo.language}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FaStar className="text-yellow-500" />
                  {repo.stargazers_count}
                </span>
                <span className="flex items-center gap-1">
                  <FaCodeBranch />
                  {repo.forks_count}
                </span>
              </div>

              {repo.topics && repo.topics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {repo.topics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-1 bg-accent-100/30 text-accent-600 text-xs rounded-md"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href={`https://github.com/${user.login}?tab=repositories`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-300 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            <FaGithub />
            View All Repositories
            <FaExternalLinkAlt className="text-sm" />
          </a>
        </div>
      </div>

    </div>
  );
};

export default GitHubProfileSection;