import React, { useState } from 'react';

const ALLOWED_DOMAIN = 'isu.edu.ph';

const LockIcon = () => (
    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
    </svg>
);

const LogoIcon = () => (
    <svg className="h-12 w-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const SpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: 'error' });

    const handleLogin = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setMessage({ text: '', type: 'error' });

        await new Promise(resolve => setTimeout(resolve, 1500));

        if (email.endsWith(`@${ALLOWED_DOMAIN}`)) {
            setMessage({ text: 'Success! Please check your email for a login link.', type: 'success' });
            setEmail('');
        } else {
            setMessage({ text: `Access is restricted to @${ALLOWED_DOMAIN} emails only.`, type: 'error' });
        }
        setIsLoading(false);
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {}
            <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-12 relative overflow-hidden">
                {}
                <div className="absolute inset-0 bg-black/10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                </div>
                
                <div className="max-w-md text-center z-10">
                    <div className="flex items-center justify-center mb-8">
                        <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                            <LogoIcon />
                        </div>
                        <h1 className="ml-4 text-4xl font-bold tracking-tight">Campus Trace</h1>
                    </div>
                    <p className="text-lg text-blue-100 leading-relaxed">
                        The trusted hub for our university's lost and found. Let's find what you're looking for.
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-2 text-blue-200">
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                        <span className="text-sm">Secure • Fast • Reliable</span>
                    </div>
                </div>
            </div>

            {}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-sm">
                    {}
                    <div className="text-center lg:hidden mb-10">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <LogoIcon />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Campus Trace</h1>
                    </div>
                    
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                            Welcome back
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Enter your university email to receive a secure login link.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-2">
                            <label htmlFor="email-address" className="block text-sm font-semibold text-gray-700">
                                University Email
                            </label>
                            <div className="relative">
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 transition duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500"
                                    placeholder="your-name@isu.edu.ph"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative flex w-full justify-center items-center gap-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-blue-400 disabled:to-blue-500 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                        >
                            {isLoading ? <SpinnerIcon /> : <LockIcon />}
                            {isLoading ? 'Sending magic link...' : 'Send Magic Link'}
                        </button>
                    </form>

                    {}
                    <div className="mt-6 min-h-[20px]">
                        {message.text && (
                            <div className={`p-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                                message.type === 'success' 
                                    ? 'bg-green-50 text-green-800 border border-green-200' 
                                    : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                {message.text}
                            </div>
                        )}
                    </div>

                    {}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-500">
                            By signing in, you agree to use Campus Trace responsibly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
