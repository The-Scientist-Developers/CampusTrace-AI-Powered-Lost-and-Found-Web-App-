import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../api/apiClient';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MessagesPage = ({ user }) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { conversationId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConversations = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    id,
                    item:items(id, title, image_url),
                    finder:profiles!conversations_finder_id_fkey(id, full_name, avatar_url),
                    claimant:profiles!conversations_claimant_id_fkey(id, full_name, avatar_url)
                `)
                .or(`finder_id.eq.${user.id},claimant_id.eq.${user.id}`);

            if (error) {
                toast.error("Failed to fetch conversations.");
                console.error(error);
            } else {
                setConversations(data);
            }
            setLoading(false);
        };

        fetchConversations();
    }, [user.id]);

    const selectedConvo = conversations.find(c => c.id.toString() === conversationId);

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-[#1a1a1a] border-t border-neutral-200 dark:border-[#3a3a3a]">
            {/* Sidebar with conversations */}
            <aside className={`w-full md:w-1/3 lg:w-1/4 border-r border-neutral-200 dark:border-[#3a3a3a] flex-shrink-0 ${conversationId && 'hidden md:block'}`}>
                <div className="p-4 border-b border-neutral-200 dark:border-[#3a3a3a]">
                    <h2 className="text-xl font-bold text-neutral-800 dark:text-white">Messages</h2>
                </div>
                {loading ? (
                    <div className="p-4"><Loader2 className="animate-spin" /></div>
                ) : (
                    <ul className="divide-y divide-neutral-200 dark:divide-[#3a3a3a] overflow-y-auto">
                        {conversations.map(convo => {
                            const otherUser = convo.finder.id === user.id ? convo.claimant : convo.finder;
                            return (
                                <li key={convo.id} onClick={() => navigate(`/dashboard/messages/${convo.id}`)} className={`p-4 flex gap-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${convo.id.toString() === conversationId && 'bg-primary-50 dark:bg-primary-500/10'}`}>
                                    <img src={otherUser.avatar_url || `https://ui-avatars.com/api/?name=${otherUser.full_name}`} alt="avatar" className="w-12 h-12 rounded-full"/>
                                    <div className="overflow-hidden">
                                        <p className="font-semibold text-neutral-800 dark:text-white truncate">{otherUser.full_name}</p>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">Regarding: {convo.item.title}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </aside>

            {/* Main Chat Window */}
            <main className={`flex-1 flex flex-col ${!conversationId && 'hidden md:flex'}`}>
                {conversationId && selectedConvo ? (
                    <ChatWindow conversation={selectedConvo} user={user} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-neutral-500">
                        <p>Select a conversation to start chatting.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

const ChatWindow = ({ conversation, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversation.id)
                .order('created_at', { ascending: true });
            
            if (error) console.error("Error fetching messages:", error);
            else setMessages(data);
        };

        fetchMessages();
    }, [conversation.id]);

    useEffect(() => {
        const channel = supabase.channel(`messages_${conversation.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversation.id}`
            }, payload => {
                setMessages(currentMessages => [...currentMessages, payload.new]);
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [conversation.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "") return;
        
        const { error } = await supabase.from('messages').insert({
            conversation_id: conversation.id,
            sender_id: user.id,
            content: newMessage,
        });

        if (error) toast.error("Failed to send message.");
        else setNewMessage("");
    };

    const otherUser = conversation.finder.id === user.id ? conversation.claimant : conversation.finder;

    return (
        <>
            <header className="p-4 border-b border-neutral-200 dark:border-[#3a3a3a] flex items-center gap-4">
                <button onClick={() => navigate('/dashboard/messages')} className="md:hidden p-2 -ml-2"><ArrowLeft /></button>
                <img src={otherUser.avatar_url || `https://ui-avatars.com/api/?name=${otherUser.full_name}`} alt="avatar" className="w-10 h-10 rounded-full"/>
                <div>
                    <p className="font-bold text-neutral-800 dark:text-white">{otherUser.full_name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Regarding: {conversation.item.title}</p>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.sender_id === user.id ? 'bg-primary-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 border-t border-neutral-200 dark:border-[#3a3a3a]">
                <form onSubmit={handleSubmit} className="flex items-center gap-4">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="form-input w-full dark:bg-[#1a1a1a]"
                    />
                    <button type="submit" className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700">
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </footer>
        </>
    );
};

export default MessagesPage;