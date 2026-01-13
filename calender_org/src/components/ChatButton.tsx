import React, { useState } from "react";
import { MessageCircle, X, Mic, Image, Type } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { parseEventFromText } from '../utils/eventParser';
import { EventItem } from '../types/event';

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
}

interface ChatButtonProps {
    onEventAdded?: (event: EventItem) => void;
    onEventRemoved?: (id: string) => void;
}

export function ChatButton({ onEventAdded }: ChatButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');

    const handleVoiceInput = async () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('このブラウザでは音声入力ができません。');
            return;
        }
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(transcript);
            handleSubmit(transcript);
        };
        recognition.onerror = () => {
            alert('音声認識エラーが発生しました');
        };
        recognition.start();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            alert('画像読み込み機能は今後実装予定です（OCR）');
            // TODO: OCR実装
        }
    };

    const handleSubmit = async (text?: string) => {
        const message = text || inputText;
        if (!message.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: message,
            sender: 'user',
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInputText('');

        const event = await parseEventFromText(message);

        const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: event
                ? `予定を追加しました: ${event.title} (${new Date(event.startISO).toLocaleString('ja-JP')})`
                : '予定の情報が不足しています。日時、場所、タイトルを教えてください。',
            sender: 'assistant',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (event && onEventAdded) {
            onEventAdded(event);
        }
    };

    return (
        <>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-8 right-8 bg-black text-white rounded-full p-4 shadow-lg hover:bg-zinc-800 transition-colors z-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <MessageCircle className="h-6 w-6" />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-8 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border flex flex-col z-40"
                    >
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">予定を追加</h2>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-zinc-100 rounded p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-sm text-zinc-500 text-center mt-4">
                                    予定を自然言語で入力してください<br />
                                    例: 「明日10時に渋谷で会議」
                                </div>
                            )}
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg p-3 ${
                                            msg.sender === 'user'
                                                ? 'bg-black text-white'
                                                : 'bg-zinc-100 text-zinc-900'
                                        }`}
                                    >
                                        <div className="text-sm">{msg.text}</div>
                                        <div className={`text-xs mt-1 ${
                                            msg.sender === 'user' ? 'text-zinc-300' : 'text-zinc-500'
                                        }`}>
                                            {msg.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t">
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={handleVoiceInput}
                                    className="p-2 rounded-lg border hover:bg-zinc-50 transition-colors"
                                    title="音声入力"
                                >
                                    <Mic className="h-5 w-5" />
                                </button>
                                <label className="p-2 rounded-lg border hover:bg-zinc-50 transition-colors cursor-pointer" title="画像から読み取り">
                                    <Image className="h-5 w-5" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSubmit()}
                                    placeholder="例: 明日10時に渋谷で会議"
                                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <button
                                    onClick={() => handleSubmit()}
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 transition-colors"
                                    title="送信"
                                >
                                    <Type className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
