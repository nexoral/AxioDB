/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  FaDev,
  FaEnvelope,
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaCode,
  FaTerminal,
  FaRocket,
  FaSpinner,
} from "react-icons/fa";
import { React as Service } from "react-caches";
import { TbBrandThreads } from "react-icons/tb";
// import GitHubProfileSection from "./GitHubProfileSection";
import { githubApi } from "../../services/githubApi";


const MaintainersZone = () => {
  const [githubUser, setGithubUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Service.UpdateDocumentTitle("AxioDB Maintainer's Zone - Resources for Core Team");

    const fetchGithubUser = async () => {
      try {
        const user = await githubApi.getUser();
        setGithubUser(user);
      } catch (error) {
        console.error('Failed to fetch GitHub user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGithubUser();
  }, []);
  const socialLinks = [
    {
      name: "Facebook",
      url: "https://www.facebook.com/theankansaha",
      icon: <FaFacebook />,
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/theankansaha",
      icon: <FaInstagram />,
    },
    {
      name: "X (Twitter)",
      url: "https://x.com/theankansaha",
      icon: <FaTwitter />,
    },
    {
      name: "Threads",
      url: "https://www.threads.com/@theankansaha",
      icon: <TbBrandThreads />,
    },
    { name: "Dev.to", url: "https://dev.to/ankansaha", icon: <FaDev /> },
    {
      name: "YouTube",
      url: "http://youtube.com/@WeekendDev",
      icon: <FaYoutube />,
    },
    { name: "GitHub", url: "https://github.com/AnkanSaha", icon: <FaGithub /> },
    {
      name: "Gmail",
      url: "mailto:ankansahaofficial@gmail.com",
      icon: <FaEnvelope />,
    },
  ];


  return (
    <div className="p-6 animate-fade-in">
      {/* Terminal-style Welcome */}
      <div className="relative bg-gray-900 dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-lg border border-gray-700 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-4 bg-gray-800 dark:bg-gray-700 flex items-center justify-start px-4 gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-400 ml-2">maintainer@axiodb:~</span>
        </div>
        <div className="pt-6 font-mono text-sm">
          <div className="text-green-400 mb-2">$ whoami</div>
          <div className="text-white mb-2">ankan-saha # AxioDB Creator & Maintainer 🚀</div>
          <div className="text-green-400 mb-2">$ cat about.txt</div>
          <div className="text-blue-400 mb-2">Full-Stack Developer | Open Source Enthusiast | Problem Solver</div>
          <div className="text-green-400 mb-2">$ git log --oneline --decorate</div>
          <div className="text-yellow-400 mb-4">✨ Building AxioDB - Making Node.js data management simple</div>
          <div className="flex items-center">
            <span className="text-green-400">$</span>
            <span className="text-white ml-2 animate-pulse">Ready to collaborate...</span>
            <span className="text-white ml-1 animate-ping">|</span>
          </div>
        </div>
      </div>

      {/* Developer Card */}
      <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white rounded-2xl shadow-2xl mb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="absolute top-4 right-4 text-6xl text-blue-400/20">
          <FaCode />
        </div>

        <div className="relative z-10 p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="relative">
              {loading ? (
                <div className="w-32 h-32 rounded-xl border-4 border-blue-400/50 shadow-xl bg-gray-300 dark:bg-gray-600 animate-pulse flex items-center justify-center">
                  <FaSpinner className="animate-spin text-gray-500" />
                </div>
              ) : (
                <img
                  src={githubUser?.avatar_url || "https://avatars.githubusercontent.com/u/56942638?v=4"}
                  alt="Ankan Saha Avatar"
                  className="w-32 h-32 rounded-xl border-4 border-blue-400/50 shadow-xl"
                />
              )}
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-gray-900 flex items-center justify-center">
                <span className="text-xs">🟢</span>
              </div>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                <FaTerminal className="text-2xl text-green-400" />
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Ankan Saha
                </h1>
              </div>

              <p className="text-xl text-gray-300 mb-4">@AnkanSaha</p>

              <p className="text-lg text-gray-300 leading-relaxed mb-6 max-w-2xl">
                🚀 Software Engineer 🚀 | Obsessed with Networking 🌐 | Computer Enthusiast 💻 | Building robust, scalable systems & exploring the depths of computer internals
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <a
                  href="https://github.com/AnkanSaha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
                >
                  <FaGithub /> View GitHub
                </a>
                <a
                  href="mailto:ankansahaofficial@gmail.com"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  <FaEnvelope /> Let's Chat
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Connect Section */}
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-white flex items-center justify-center gap-3">
            <FaRocket className="text-blue-400" />
            Let's Connect & Build Together
          </h2>
          <p className="text-gray-300 text-lg">
            Always open to collaborate on exciting projects and meet fellow developers! 🤝
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {socialLinks.map((link) => {
            const getHoverColor = (name: string) => {
              switch (name) {
                case 'GitHub': return 'hover:bg-gray-800';
                case 'Dev.to': return 'hover:bg-gray-800';
                case 'YouTube': return 'hover:bg-red-600';
                case 'X (Twitter)': return 'hover:bg-black';
                case 'Gmail': return 'hover:bg-red-600';
                default: return 'hover:bg-blue-600';
              }
            };

            return (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col items-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 transition-all duration-300 transform hover:scale-105 ${getHoverColor(link.name)}`}
              >
                <span className="text-3xl mb-2 text-white group-hover:scale-110 transition-transform">
                  {link.icon}
                </span>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors text-center">
                  {link.name}
                </span>
              </a>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-4xl">💬</div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-white mb-1">Got an Idea?</h3>
              <p className="text-gray-300 text-sm">Let's discuss your next project or contribution to AxioDB!</p>
            </div>
            <a
              href="mailto:ankansahaofficial@gmail.com"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Say Hi! 👋
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintainersZone;
