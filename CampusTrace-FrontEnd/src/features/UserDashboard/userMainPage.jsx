import React from 'react';
import { LogOut, ArrowRight } from 'lucide-react';

// --- Mock Data (no changes needed) ---
const suggestedMatchesData = [
  { id: 1, title: 'Lost Backpack', status: 'Lost', imageUrl: '...' },
  { id: 2, title: 'New Bicycle', status: 'Found', imageUrl: '...' },
  { id: 3, title: 'Found Tablet', status: 'Found', imageUrl: '...' },
];
const recentActivityData = [
  { id: 1, title: 'Black Wallet', time: '2 days ago', type: 'wallet' },
  { id: 2, title: 'Book - "The Great Gatsby"', time: '1 week ago', type: 'book' },
];

// --- Reusable Icon Components (no changes needed) ---
const WalletIcon = () => ( <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg> );
const BookIcon = () => ( <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> );


// --- Re-themed Reusable UI Components ---

const MatchCard = ({ item }) => {
  const isLost = item.status === 'Lost';
  // New subtle badge styles for dark theme
  const badgeClass = isLost 
    ? 'bg-red-900/50 text-red-400' 
    : 'bg-green-900/50 text-green-400';

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 transition-colors hover:bg-neutral-800 cursor-pointer">
      <div className="w-full h-32 bg-neutral-800 border border-neutral-700 rounded-md mb-4 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Image</p>
      </div>
      <h3 className="font-semibold text-neutral-100">{item.title}</h3>
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full mt-2 inline-block ${badgeClass}`}>
        {item.status}
      </span>
    </div>
  );
};

const ActivityItem = ({ item }) => {
  return (
    <a href="#" className="flex items-center gap-4 py-3 hover:bg-neutral-800/50 -mx-4 px-4 rounded-lg transition-colors">
      <div className="w-12 h-12 bg-neutral-800 rounded-md flex-shrink-0 flex items-center justify-center">
        {item.type === 'wallet' && <WalletIcon />}
        {item.type === 'book' && <BookIcon />}
      </div>
      <div className="flex-grow">
        <p className="font-medium text-neutral-100">{item.title}</p>
        <p className="text-sm text-neutral-400">{item.time}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-neutral-500" />
    </a>
  );
};


// --- Main Dashboard Component ---

export default function DashboardContent() {
  return (
    // The main background color is now handled by the Layout component's <main> tag
    <div className="text-white">
      
      {/* Header is now part of the Layout, so we remove the Sign Out button from here */}

      {/* Suggested Matches Section */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Suggested Matches</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {suggestedMatchesData.map(item => (
            <MatchCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4 divide-y divide-neutral-800">
          {recentActivityData.map(item => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </div>
      </section>

    </div>
  );
}