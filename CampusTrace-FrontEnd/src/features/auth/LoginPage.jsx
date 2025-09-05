import React, { useState } from 'react';
import { apiClient } from '../../api/apiClient';

const ALLOWED_DOMAIN = 'isu.edu.ph';

const LockIcon = () => (
    <svg className="h-5 w-5 text-blue-400 group-hover:text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
    </svg>
);

const LogoIcon = () => (
    <svg className="mx-auto h-12 w-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

        try {
            const response = await apiClient.signInWithMagicLink(email);
            setMessage({ text: response.message, type: 'success' });
            setEmail('');
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }

        setIsLoading(false);
    };

    const messageColor = message.type === 'success' ? 'text-green-400' : 'text-red-400';

    return (
        <div className="bg-slate-900 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                
                {}
                <div className="text-center">
                    <LogoIcon />
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-100">
                        Campus Trace
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Sign in to find what you're looking for.
                    </p>
                </div>

                {}
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email-address" className="sr-only">Email address</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="relative block w-full appearance-none rounded-md border border-slate-700 bg-slate-800 px-3 py-3 text-slate-100 placeholder-slate-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                            placeholder="Enter your university email address"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-3 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <LockIcon />
                            </span>
                            {isLoading ? 'Sending Link...' : 'Send Magic Link'}
                        </button>
                    </div>
                </form>

                {}
                <div className="h-5">
                   {message.text && <p className={`text-sm text-center font-medium ${messageColor}`}>{message.text}</p>}
                </div>
            </div>
        </div>
    );
}