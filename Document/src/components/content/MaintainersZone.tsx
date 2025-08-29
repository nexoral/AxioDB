import {
  FaDev,
  FaEnvelope,
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import { GiAchievement, GiJourney, GiSkills } from "react-icons/gi";
import { MdSchool, MdWork } from "react-icons/md";
import { TbBrandThreads } from "react-icons/tb";

const MaintainersZone = () => {
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

  const milestones = [
    {
      icon: <MdSchool className="text-blue-500 text-4xl" />,
      title: "Humble Beginnings",
      description:
        "Hi, I'm Ankan! I was born in Ranaghat, a small town where I started my journey with limited resources but an unquenchable curiosity for technology.",
    },
    {
      icon: <GiJourney className="text-green-500 text-4xl" />,
      title: "Overcoming Challenges",
      description:
        "Life threw many challenges my way, from academic setbacks to personal struggles. But I turned every failure into a stepping stone for growth.",
    },
    {
      icon: <MdWork className="text-orange-500 text-4xl" />,
      title: "Professional Growth",
      description:
        "I began my career as a Software Engineer, working tirelessly to learn, build, and contribute to impactful projects.",
    },
    {
      icon: <GiSkills className="text-purple-500 text-4xl" />,
      title: "Technical Expertise",
      description:
        "Over the years, I have mastered JavaScript, Node.js, React, and more. I'm always eager to learn new technologies and push my boundaries.",
    },
    {
      icon: <GiAchievement className="text-red-500 text-4xl" />,
      title: "Future Aspirations",
      description:
        "My journey is far from over. I aim to inspire others through my story and continue growing both personally and professionally.",
    },
  ];

  return (
    <div className="p-6 animate-fade-in">
      {/* Hero Section with Avatar */}
      <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white p-10 rounded-2xl shadow-2xl mb-10 flex flex-col items-center">
        <img
          src="https://avatars.githubusercontent.com/u/56942638?v=4"
          alt="Ankan Saha Avatar"
          className="w-28 h-28 rounded-full border-4 border-white shadow-lg mb-4 animate-float"
        />
        <h1 className="text-5xl font-extrabold mb-2 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent text-center animate-slide-in-right">
          Hi, I'm Ankan!
        </h1>
        <p className="text-lg leading-relaxed mb-4 text-center max-w-2xl animate-fade-in-up">
          From a small town in Ranaghat to building AxioDB, my journey is about resilience, curiosity, and the power of self-learning. I believe in turning challenges into opportunities and inspiring others to do the same.
        </p>
        <div className="flex gap-4 mt-2">
          <a href="mailto:ankansahaofficial@gmail.com" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-50 transition-colors">Contact Me</a>
          <a href="https://github.com/AnkanSaha" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition-colors">GitHub</a>
        </div>
      </div>

      {/* Timeline Section */}
      <h2 className="text-3xl font-bold mt-8 mb-6 text-center bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 bg-clip-text text-transparent">My Journey</h2>
      <div className="relative max-w-3xl mx-auto">
        <div className="border-l-4 border-blue-500 dark:border-purple-500 absolute h-full left-6 top-0"></div>
        <ul className="space-y-10">
          {milestones.map((milestone, index) => (
            <li key={index} className="relative flex items-center gap-6">
              <div className="z-10 bg-white dark:bg-gray-900 p-3 rounded-full shadow-lg border-2 border-blue-500 dark:border-purple-500 animate-float">
                {milestone.icon}
              </div>
              <div className="ml-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-2 animate-fade-in-up">
                <h3 className="text-xl font-bold text-blue-700 dark:text-purple-400 mb-2">{milestone.title}</h3>
                <p className="text-gray-700 dark:text-gray-300">{milestone.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Social Section */}
      <h2 className="text-3xl font-bold mt-12 mb-6 text-center bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 bg-clip-text text-transparent">Connect with Me</h2>
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {socialLinks.map((link) => (
          <li key={link.name} className="group">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-2 border border-blue-100 dark:border-purple-700"
            >
              <span className="text-5xl mb-2 text-blue-500 group-hover:text-purple-500 transition-colors">{link.icon}</span>
              <span className="text-base font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">
                {link.name}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MaintainersZone;
