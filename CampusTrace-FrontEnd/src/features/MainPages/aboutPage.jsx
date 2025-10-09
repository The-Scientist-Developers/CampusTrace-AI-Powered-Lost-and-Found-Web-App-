import React from "react";
import { Github, Linkedin } from "lucide-react"; // Import icons

// Reusable component for each team member - simplified
const TeamMemberCard = ({ name, role, imageUrl, githubUrl, linkedinUrl }) => (
  <div className="flex flex-col items-center bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg transition-transform duration-300 hover:scale-105">
    <div className="w-28 h-28 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden mb-4 border-2 border-red-600/50">
      {/* If you have actual images, replace the placeholder URL */}
      <img
        src={
          imageUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${
            name.split(" ")[0]
          }&backgroundColor=ef4444,be123c,dc2626&backgroundType=gradientLinear&radius=50`
        }
        alt={name}
        className="w-full h-full object-cover"
      />
    </div>
    <h3 className="text-xl font-bold text-white mt-2">{name}</h3>
    <p className="text-red-400 text-sm mb-4">{role}</p>
    <div className="flex justify-center gap-4 mt-2">
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-white transition-colors duration-200"
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
          className="text-zinc-400 hover:text-white transition-colors duration-200"
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
      role: "Project Lead / Student Full Stack AI-augmented Developer/ Database Architect",
      imageUrl: "",
      githubUrl: "https://github.com/ImFrankB",
      linkedinUrl: "https://linkedin.com/in/your-bugauisan-profile",
    },
    {
      name: "William Ray M. Respicio",
      role: "Student Frontend AI-augmented Developer/UI Designer",
      imageUrl: "",
      githubUrl: "https://github.com/your-respicio-profile",
      linkedinUrl: "https://linkedin.com/in/your-respicio-profile",
    },
    {
      name: "Jerome Ian Cacho",
      role: "Student Frontend AI-augmented Developer/UI Designer",
      imageUrl: "",
      githubUrl: "https://github.com/your-cacho-profile",
      linkedinUrl: "https://linkedin.com/in/your-cacho-profile",
    },
  ];

  return (
    <div className="bg-zinc-950 text-zinc-300 min-h-screen pt-20 pb-12 flex flex-col justify-center items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
          About Our Team
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12">
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
