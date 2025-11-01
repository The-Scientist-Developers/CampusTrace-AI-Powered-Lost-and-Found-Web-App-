import React from "react";
import { Github, Linkedin } from "lucide-react";
import JohnImage from "../../assets/frank.jpg";
import WilliamImage from "../../assets/william.jpg";
import JeromeImage from "../../assets/jerome.jpg";

const TeamMemberCard = ({ name, role, imageUrl, githubUrl, linkedinUrl }) => (
  <div className="flex flex-col items-center bg-white dark:bg-[#2a2a2a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl p-6 shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-lg">
    <div className="w-28 h-28 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden mb-4 border-2 border-primary-500/50">
      <img
        src={
          imageUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${
            name.split(" ")[0]
          }&backgroundColor=6366f1,4f46e5,4338ca&backgroundType=gradientLinear&radius=50`
        }
        alt={name}
        className="w-full h-full object-cover"
      />
    </div>
    <h3 className="text-xl font-bold text-neutral-800 dark:text-white mt-2">
      {name}
    </h3>
    <p className="text-primary-600 dark:text-primary-400 text-sm mb-4 text-center">
      {role}
    </p>
    <div className="flex justify-center gap-4 mt-2">
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
          aria-label={`${name}'s GitHub`}
        >
          <Github className="w-6 h-6" />
        </a>
      )}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
          aria-label={`${name}'s LinkedIn`}
        >
          <Linkedin className="w-6 h-6" />
        </a>
      )}
    </div>
  </div>
);

export default function AboutUsPage() {
  const teamMembers = [
    {
      name: "John Franklin C. Bugauisan",
      role: "Project Lead / Full Stack AI-augmented Developer/ UI Designer",
      imageUrl: JohnImage,
      githubUrl: "https://github.com/ImFrankB",
      linkedinUrl:
        "https://www.linkedin.com/in/john-franklin-bugauisan-86aa16309/",
    },
    {
      name: "William Ray M. Respicio",
      role: "Frontend AI-augmented Developer / UI Designer",
      imageUrl: WilliamImage,
      githubUrl: "https://github.com/williamUser-ops",
      linkedinUrl:
        "https://www.linkedin.com/in/respicio-william-ray-m-0b5969384/",
    },
    {
      name: "Jerome Ian N. Cacho",
      role: "Frontend AI-augmented Developer / UI Designer",
      imageUrl: JeromeImage,
      githubUrl: "https://github.com/iiiiaannnnnnn",
      linkedinUrl: "https://www.linkedin.com/in/jerome-ian-cacho-19a46233a/",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1a1a1a] text-neutral-700 dark:text-gray-100 min-h-screen pt-28 pb-12 flex flex-col justify-center items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white mb-6">
          About Our Team
        </h1>
        <p className="text-lg sm:text-xl text-neutral-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12">
          We are a dedicated team of student developers from Isabela State
          University, bringing innovative solutions to campus challenges. Campus
          Trace is our project, born from a passion for technology and
          community.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 mt-12">
          {teamMembers.map((member, index) => (
            <TeamMemberCard
              key={member.name}
              {...member}
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
