import React, { useState, useCallback, useEffect, useRef } from 'react';
import FileUpload from './components/FileUpload';
import AdminPanel from './components/AdminPanel';
import ResultsDisplay from './components/ResultsDisplay';
import LoginScreen from './components/LoginScreen';
import { BotIcon, SettingsIcon, SunIcon, MoonIcon, RefreshCwIcon, UserIcon, GithubIcon, LinkedinIcon, TwitterIcon, LogOutIcon } from './components/icons';
import { getAnswerFromContext, retrieveContext, detectLanguage } from './services/geminiService';
import type { ApiResponse, Settings, KnowledgeSource, ChatMessage } from './types';

const loadingMessages = [
    "Ingesting documents...",
    "Extracting structure and key topics...",
    "Searching for relevant information...",
    "Synthesizing the answer...",
];

type Theme = 'light' | 'dark';

const FONT_SIZE_MAP: { [key in Settings['appearance']['fontSize']]: string } = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
};

const BG_COLOR_MAP: { [key in Settings['appearance']['chatBackgroundColor']]: string } = {
  default: 'bg-gray-100 dark:bg-gray-900',
  blue: 'bg-blue-50 dark:bg-slate-900',
  green: 'bg-green-50 dark:bg-emerald-950',
  beige: 'bg-orange-50 dark:bg-stone-900',
};


const App: React.FC = () => {
    const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
    const [query, setQuery] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    
    const [settings, setSettings] = useState<Settings>(() => {
        const savedSettings = localStorage.getItem('appSettings');
        const defaultSettings: Settings = {
            model: 'general',
            maxTokens: 1024,
            chunkSize: 800,
            retrievedPassages: 5,
            appearance: {
                chatBackgroundColor: 'default',
                fontSize: 'base',
            }
        };
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            return {
                ...defaultSettings,
                ...parsed,
                appearance: {
                    ...defaultSettings.appearance,
                    ...(parsed.appearance || {}),
                }
            };
        }
        return defaultSettings;
    });

    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme) {
            return savedTheme;
        }
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail) {
            setUserEmail(storedEmail);
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }, [settings]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleLogin = (email: string) => {
        localStorage.setItem('userEmail', email);
        setUserEmail(email);
    };

    const handleLogout = () => {
        localStorage.removeItem('userEmail');
        setUserEmail(null);
        setChatHistory([]);
        setKnowledgeSources([]);
        setError(null);
    };

    useEffect(() => {
        if (!isLoading) {
            return;
        }

        let messageIndex = 0;
        setLoadingMessage(loadingMessages[0]);

        const interval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 2000);

        return () => clearInterval(interval);
    }, [isLoading]);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, isLoading]);

    const handleAsk = useCallback(async (currentQuery: string) => {
        const completedSources = knowledgeSources.filter(s => s.status === 'completed');
        if (!currentQuery.trim()) return;

        if (completedSources.length === 0) {
            setError("Please add a file or URL and wait for it to be ready before asking a question.");
            return;
        }
        setError(null);
        
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: currentQuery
        };
        setChatHistory(prev => [...prev, userMessage]);
        setIsLoading(true);

        const detectedLanguage = detectLanguage(currentQuery);

        try {
            const context = await retrieveContext(completedSources, currentQuery);
            await new Promise(resolve => setTimeout(resolve, 2000));
            const apiResponse = await getAnswerFromContext(currentQuery, context, detectedLanguage);
            const modelMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: apiResponse
            };
            setChatHistory(prev => [...prev, modelMessage]);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [knowledgeSources]);

    const handleQuerySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAsk(query);
        setQuery('');
    };

    const handleFollowUp = (followUpQuery: string) => {
        handleAsk(followUpQuery);
    };

    const handleClearChat = () => {
        setChatHistory([]);
        setError(null);
        setQuery('');
        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isQueryingDisabled && query.trim()) {
          handleAsk(query);
          setQuery('');
        }
      }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [query]);
    
    if (!userEmail) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    const hasCompletedSources = knowledgeSources.some(s => s.status === 'completed');
    const isQueryingDisabled = !hasCompletedSources || isLoading;

    const chatBgClass = BG_COLOR_MAP[settings.appearance.chatBackgroundColor] || BG_COLOR_MAP.default;
    const fontSizeClass = FONT_SIZE_MAP[settings.appearance.fontSize] || FONT_SIZE_MAP.base;

    return (
        <div className={`flex flex-col h-screen text-gray-900 dark:text-gray-100 ${fontSizeClass}`}>
            <Header 
                theme={theme}
                toggleTheme={toggleTheme}
                setShowSettings={() => setShowSettings(s => !s)}
                userEmail={userEmail}
                onLogout={handleLogout}
            />
            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:block w-full md:w-1/3 lg:w-1/4 p-4 md:p-6 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
                    {showSettings ? (
                        <AdminPanel settings={settings} setSettings={setSettings} />
                    ) : (
                        <FileUpload sources={knowledgeSources} setSources={setKnowledgeSources} />
                    )}
                </aside>

                <main className={`flex-1 flex flex-col p-4 md:p-6 transition-colors duration-300 ${chatBgClass}`}>
                    <div ref={chatContainerRef} className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto pr-4 space-y-6">
                        {chatHistory.length === 0 && !isLoading && !error && (
                            <div className="text-center text-gray-500 dark:text-gray-400 h-full flex flex-col justify-center items-center">
                            <BotIcon className="w-16 h-16 mx-auto mb-4 text-gray-400"/>
                            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">নলেজ বুক এসিস্ট্যান্ট</h2>
                            <p className="mt-2 max-w-md mx-auto">"নলেজ বুক এসিস্ট্যান্ট" এ আপনাকে স্বাগত। আপনি আপনার ইচ্ছামতো যেকোন পিডিএফ বা ওয়ার্ড ফাইল নলেজ বেজ এ যুক্ত করে সহজেই যেকোন সময় আপনার কাঙ্খিত তথ্য জেনে নিতে পারবেন। ভূলে গেলেও "নলেজ বুক এসিস্ট্যান্ট" আপনাকে মনে করিয়ে দিবে।</p>
                            </div>
                        )}
                        
                        {chatHistory.map(message => (
                            <div key={message.id}>
                                {message.role === 'user' ? (
                                    <UserMessage content={message.content as string} />
                                ) : (
                                    <ModelMessage response={message.content as ApiResponse} onFollowUp={handleFollowUp} />
                                )}
                            </div>
                        ))}

                        {isLoading && <LoadingSpinner message={loadingMessage} />}
                        {error && <ErrorMessage message={error} />}
                    </div>

                    <div className="mt-auto pt-6 w-full max-w-3xl mx-auto">
                        {chatHistory.length > 0 && (
                            <div className="flex justify-center mb-2">
                                <button
                                    onClick={handleClearChat}
                                    title="Start New Chat"
                                    className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <RefreshCwIcon className="w-4 h-4" />
                                    New Chat
                                </button>
                            </div>
                        )}
                        <form onSubmit={handleQuerySubmit} className="relative">
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    knowledgeSources.length === 0 ? "Please add a document or URL first" :
                                    !hasCompletedSources ? "Waiting for sources to be ready..." :
                                    "Ask a question about your knowledge base..."
                                }
                                disabled={isQueryingDisabled}
                                className="w-full pl-4 pr-4 py-3 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 resize-none overflow-y-auto max-h-40"
                            />
                        </form>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

const Header: React.FC<{ theme: Theme; toggleTheme: () => void; setShowSettings: () => void; userEmail: string; onLogout: () => void; }> = ({ theme, toggleTheme, setShowSettings, userEmail, onLogout }) => {
    return (
        <header className="flex-shrink-0 flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700/50 shadow-sm">
            <div className="flex items-center gap-2">
                <BotIcon className="w-7 h-7 text-primary" />
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">নলেজ বুক এসিস্ট্যান্ট</h1>
            </div>
            <div className="flex items-center space-x-2">
                 <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 p-1 pr-3 rounded-full">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{userEmail}</span>
                </div>
                 <button
                    onClick={onLogout}
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    aria-label="Log out"
                    title="Log out"
                >
                    <LogOutIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? (
                        <MoonIcon className="w-5 h-5" />
                    ) : (
                        <SunIcon className="w-5 h-5" />
                    )}
                </button>
                <button
                    onClick={setShowSettings}
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    aria-label="Toggle settings panel"
                    title="Toggle settings panel"
                >
                    <SettingsIcon className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

const Footer: React.FC = () => {
    return (
        <footer className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-center sm:text-left">
                    <p>&copy; 2024 | Knowledge Book Assistant. All rights reserved.</p>
                    <p className="text-sm font-semibold text-primary dark:text-primary-400 mt-1">App idea and created by: Md. Razibul Hasan, AI Bot/Agent Building Expert.</p>
                    <p className="mt-1">Powered by <a href="https://ai.google.dev/gemini-api" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Google Gemini</a></p>
                </div>
                <div className="flex items-center gap-4">
                    <a href="#" aria-label="Github" className="hover:text-primary"><GithubIcon className="w-5 h-5"/></a>
                    <a href="#" aria-label="LinkedIn" className="hover:text-primary"><LinkedinIcon className="w-5 h-5"/></a>
                    <a href="#" aria-label="Twitter" className="hover:text-primary"><TwitterIcon className="w-5 h-5"/></a>
                </div>
            </div>
        </footer>
    );
};

const UserMessage: React.FC<{ content: string }> = ({ content }) => (
    <div className="flex justify-end">
        <div className="flex items-start gap-3 max-w-xl">
            <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-none">
                <p>{content}</p>
            </div>
             <div className="w-8 h-8 flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-primary" />
            </div>
        </div>
    </div>
);

const ModelMessage: React.FC<{ response: ApiResponse, onFollowUp: (q: string) => void }> = ({ response, onFollowUp }) => (
     <div className="flex items-start gap-3 max-w-xl">
        <div className="w-8 h-8 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <BotIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </div>
        <div className="flex-1">
            <ResultsDisplay response={response} onFollowUp={onFollowUp} />
        </div>
    </div>
);

const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center space-x-2 py-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="w-full p-4 my-4 text-center bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="font-medium">An Error Occurred</p>
        <p className="text-sm">{message}</p>
    </div>
);

export default App;