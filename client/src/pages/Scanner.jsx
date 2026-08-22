import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui/base';
import { Mic, MicOff, Save } from 'lucide-react';
import { AddTransactionModal } from '@/components/ui/add-transaction-modal';
import { useTransactions } from '@/context/TransactionContext';

export default function ScannerPage() {
    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [voiceText, setVoiceText] = useState('');
    const [voiceData, setVoiceData] = useState(null);
    const recognitionRef = useRef(null);

    // Transaction Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialData, setModalInitialData] = useState(null);
    const { addTransaction } = useTransactions();

    // --- Voice Handling ---
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn("Speech API not supported in this browser.");
        }
        
        return () => {
             if (recognitionRef.current) {
                 recognitionRef.current.stop();
             }
        };
    }, []);

    const toggleListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support voice recognition. Try Chrome.");
            return;
        }

        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                alert("Microphone access denied. Please allow microphone permissions in your browser settings.");
            }
        };

        recognition.onresult = (event) => {
            if (event.results && event.results[0]) {
                const transcript = event.results[0][0].transcript;
                setVoiceText(transcript);
                processVoiceCommand(transcript);
            }
        };

        try {
            recognition.start();
        } catch (e) {
            console.error("Failed to start recognition", e);
            setIsListening(false);
        }
    };

    const processVoiceCommand = (text) => {
        if (!text) return;
        const lower = text.toLowerCase();
        // Simple Parser: "Spent 50 dollars on food"

        // Amount
        const amountRegex = /(\d+(\.\d{1,2})?)/;
        const amountMatch = lower.match(amountRegex);
        const amount = amountMatch ? amountMatch[0] : '';

        // Category extraction (naive)
        const categories = ['food', 'travel', 'shopping', 'bills', 'entertainment', 'health', 'housing', 'transport', 'groceries'];
        const foundCategory = categories.find(c => lower.includes(c)) || 'General';

        const type = lower.includes('income') || lower.includes('earned') || lower.includes('deposit') ? 'Income' : 'Expense';

        setVoiceData({
            description: text.charAt(0).toUpperCase() + text.slice(1),
            amount,
            category: foundCategory.charAt(0).toUpperCase() + foundCategory.slice(1),
            type,
            date: new Date().toISOString().split('T')[0]
        });
    };

    const saveVoice = () => {
        if (!voiceData) return;
        setModalInitialData(voiceData);
        setIsModalOpen(true);
    };

    const handleModalSave = (tx) => {
        addTransaction(tx);
        setIsModalOpen(false);
        setVoiceText('');
        setVoiceData(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Input Scanner</h1>
                    <p className="text-slate-400 dark:text-slate-400 mt-1">Add transactions quickly using voice commands</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* ----- Voice Logger Section ----- */}
                <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8">
                    <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Mic size={24} className="text-blue-400" />
                        </div>
                        Voice Logger
                    </h3>

                    <div className="flex flex-col items-center justify-center min-h-[250px] space-y-8 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
                        <div className="relative">
                            {isListening && (
                                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse scale-150"></div>
                            )}
                            <button
                                onClick={toggleListening}
                                className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-4 ${isListening ? 'bg-red-500 border-red-400 scale-110 shadow-red-500/50' : 'bg-blue-600 hover:bg-blue-500 border-blue-500 shadow-blue-500/30'}`}
                            >
                                {isListening ? <MicOff size={48} className="text-slate-900 dark:text-white" /> : <Mic size={48} className="text-slate-900 dark:text-white" />}
                            </button>
                        </div>

                        <p className="text-slate-400 dark:text-slate-400 text-sm font-medium text-center">
                            {isListening ? (
                                <span className="text-red-400 animate-pulse">Listening... say something like "Spent ₹20 on Lunch"</span>
                            ) : (
                                "Tap the microphone to speak transaction details"
                            )}
                        </p>
                    </div>

                    {voiceText && (
                        <div className="bg-slate-100 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-300 dark:border-slate-700">
                            <p className="text-slate-700 dark:text-slate-200 font-medium mb-4 italic px-2">"{voiceText}"</p>

                            {voiceData && (
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-300 dark:border-slate-700/50 text-center">
                                        <span className="text-slate-400 dark:text-slate-400 block text-xs uppercase tracking-wider mb-1">Amount</span>
                                        <span className="font-bold text-lg text-slate-900 dark:text-white">₹{voiceData.amount || '0.00'}</span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-300 dark:border-slate-700/50 text-center">
                                        <span className="text-slate-400 dark:text-slate-400 block text-xs uppercase tracking-wider mb-1">Category</span>
                                        <span className="font-bold text-slate-900 dark:text-white max-w-[100px] truncate mx-auto block">{voiceData.category}</span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-300 dark:border-slate-700/50 col-span-2 flex items-center justify-between">
                                        <span className="text-slate-400 dark:text-slate-400 text-xs uppercase tracking-wider">Type</span>
                                        <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${voiceData.type === 'Income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                            {voiceData.type}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={saveVoice}
                                disabled={!voiceData}
                                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={20} className="mr-2" /> Save to Log
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleModalSave}
                initialData={modalInitialData}
            />
        </div>
    );
}
