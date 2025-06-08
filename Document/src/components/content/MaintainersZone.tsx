import React from "react";
import { FaFacebook, FaInstagram, FaTwitter, FaGithub, FaYoutube, FaDev, FaEnvelope } from "react-icons/fa";
import { TbBrandThreads } from "react-icons/tb";
import { GiJourney, GiAchievement, GiSkills } from "react-icons/gi";
import { MdSchool, MdWork } from "react-icons/md";

const MaintainersZone = () => {
    const socialLinks = [
        { name: "Facebook", url: "https://www.facebook.com/theankansaha", icon: <FaFacebook /> },
        { name: "Instagram", url: "https://www.instagram.com/theankansaha", icon: <FaInstagram /> },
        { name: "X (Twitter)", url: "https://x.com/theankansaha", icon: <FaTwitter /> },
        { name: "Threads", url: "https://www.threads.com/@theankansaha", icon: <TbBrandThreads /> },
        { name: "Dev.to", url: "https://dev.to/ankansaha", icon: <FaDev /> },
        { name: "YouTube", url: "http://youtube.com/@WeekendDev", icon: <FaYoutube /> },
        { name: "GitHub", url: "https://github.com/AnkanSaha", icon: <FaGithub /> },
        { name: "Gmail", url: "mailto:ankansahaofficial@gmail.com", icon: <FaEnvelope /> },
    ];

    const milestones = [
        {
            icon: <MdSchool className="text-blue-500 text-4xl" />,
            title: "Humble Beginnings",
            description: "Hi, I'm Ankan! I was born in Ranaghat, a small town where I started my journey with limited resources but an unquenchable curiosity for technology.",
        },
        {
            icon: <GiJourney className="text-green-500 text-4xl" />,
            title: "Overcoming Challenges",
            description: "Life threw many challenges my way, from academic setbacks to personal struggles. But I turned every failure into a stepping stone for growth.",
        },
        {
            icon: <MdWork className="text-orange-500 text-4xl" />,
            title: "Professional Growth",
            description: "I began my career as a Software Engineer, working tirelessly to learn, build, and contribute to impactful projects.",
        },
        {
            icon: <GiSkills className="text-purple-500 text-4xl" />,
            title: "Technical Expertise",
            description: "Over the years, I have mastered JavaScript, Node.js, React, and more. I'm always eager to learn new technologies and push my boundaries.",
        },
        {
            icon: <GiAchievement className="text-red-500 text-4xl" />,
            title: "Future Aspirations",
            description: "My journey is far from over. I aim to inspire others through my story and continue growing both personally and professionally.",
        },
    ];

    return (
        <div className="p-6 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg shadow-lg">
                <h1 className="text-4xl font-bold mb-4 text-center">Hi, I'm Ankan!</h1>
                <p className="text-lg leading-relaxed mb-6 text-center">
                    From a small town in Ranaghat to becoming a Software Engineer, my journey is a story of resilience, determination, and the power of self-learning. Here's how I turned challenges into opportunities and built a life I'm proud of.
                </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-center">My Journey</h2>
            <ul className="space-y-6">
                {milestones.map((milestone, index) => (
                    <li key={index} className="flex items-start gap-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-2">
                        <div>{milestone.icon}</div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{milestone.title}</h3>
                            <p className="text-gray-700 dark:text-gray-300">{milestone.description}</p>
                        </div>
                    </li>
                ))}
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-center">Social Handles</h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {socialLinks.map((link) => (
                    <li key={link.name} className="group">
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-2"
                        >
                            <span className="text-4xl mb-2 text-blue-500">{link.icon}</span>
                            <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-500">{link.name}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MaintainersZone;
