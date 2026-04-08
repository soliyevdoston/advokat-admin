import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User, MoreVertical, Phone, Video, Search, Smile, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../config/appConfig';
const MotionDiv = motion.div;

// Chat turlariga mos endpoint
const CHAT_ENDPOINTS = {
  ai: ['/user/chats/send', '/chat/ai'],
  document: ['/user/chats/send', '/chat/ai'],
  expert: ['/user/chats/send', '/chat/support'],
  lawyer: ['/user/chats/send', '/chat/support'],
};

export default function ChatInterface({ title, subtitle, type = 'ai', initialMessage }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { authToken, user, ensureSupportConversation, sendSupportMessage, safeError } = useAuth();

  const [messages, setMessages] = useState([
    { id: 1, text: initialMessage, sender: 'bot', timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [handoffError, setHandoffError] = useState('');
  const messagesEndRef = useRef(null);

  const allContacts = [
    { id: 'ai', name: t('chat_interface.roles.ai'), status: 'online', type: 'ai' },
    { id: 1, name: 'Azizov Bahrom', status: 'online', type: 'lawyer' },
    { id: 2, name: 'Karimova Nargiza', status: 'offline', type: 'lawyer' },
    { id: 3, name: 'Toshmatov Dilshod', status: 'online', type: 'lawyer' },
  ];

  const contacts = allContacts.filter(contact => {
    if (type === 'ai' || type === 'document') return contact.type === 'ai';
    if (type === 'expert' || type === 'lawyer') return contact.type === 'lawyer';
    return true;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Backend ga so'rov yuborish
  const fetchBotResponse = async (userText) => {
    const endpoints = CHAT_ENDPOINTS[type] || CHAT_ENDPOINTS.ai;

    const headers = {
      'Content-Type': 'application/json',
    };

    // Agar foydalanuvchi tizimga kirgan bo'lsa, token qo'shamiz
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Conversation tarixi (oxirgi 10 ta xabar)
    const history = messages.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    let data = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(buildApiUrl(endpoint), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: userText,
            text: userText,
            history,
            type,
            userId: user?.id || null,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const err = new Error(errData.message || `Server xatosi: ${res.status}`);
          err.status = res.status;
          throw err;
        }

        data = await res.json();
        break;
      } catch (err) {
        lastError = err;
        if (err?.status === 404 || err?.status === 405) continue;
        throw err;
      }
    }

    if (!data) {
      throw lastError || new Error('Chat endpoint topilmadi');
    }

    return {
      text: data.reply || data.message || data.response || "Javob olinmadi.",
      handoffToAdmin: Boolean(
        data.handoffToAdmin ||
        data.needsHuman ||
        data.needs_human ||
        data.escalate
      ),
    };
  };

  const handoffToAdmin = async ({ firstMessage }) => {
    if (!user) {
      setHandoffError("Adminga ulash uchun avval tizimga kiring.");
      return;
    }

    setHandoffLoading(true);
    setHandoffError('');

    try {
      const conv = await ensureSupportConversation();
      const text = firstMessage?.trim();

      if (text) {
        await sendSupportMessage({
          conversationId: conv.id,
          text: `AI chatdan o'tkazildi:\n${text}`,
          receiver: 'admin',
        });
      }

      navigate('/chat/support');
    } catch (err) {
      setHandoffError(safeError(err, "Adminga ulashda xatolik yuz berdi"));
    } finally {
      setHandoffLoading(false);
    }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMsg = { id: Date.now(), text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setHandoffError('');

    try {
      const result = await fetchBotResponse(text);
      const botMsg = {
        id: Date.now() + 1,
        text: result.text,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);

      if ((type === 'ai' || type === 'document') && result.handoffToAdmin) {
        await handoffToAdmin({
          firstMessage: `Mijoz savoli: ${text}\n\nAI javobi: ${result.text}`,
        });
      }
    } catch (err) {
      console.error('Chat xatosi:', err.message);
      // Xato xabarini chat ichiga qo'shamiz
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          text: `⚠️ ${err.message}`,
          sender: 'bot',
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 flex h-[700px] md:h-[800px]">
      {/* Sidebar */}
      <div className="hidden md:flex w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-700 flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('chat_interface.sidebar_title')}</h3>
          <div className="relative">
            <input
              type="text"
              placeholder={t('chat_interface.search_placeholder')}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                (contact.type === 'ai' && (type === 'ai' || type === 'document'))
                  ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  contact.type === 'ai'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {contact.type === 'ai' ? <Bot size={20} /> : <User size={20} />}
                </div>
                {contact.status === 'online' && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{contact.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {contact.type === 'ai' ? t('chat_interface.roles.ai') : t('chat_interface.roles.lawyer')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/50">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
              type === 'ai' || type === 'document'
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                : 'bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white'
            }`}>
              {type === 'ai' || type === 'document' ? <Bot size={24} /> : <User size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isLoading ? 'Javob yozmoqda...' : subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <Button variant="ghost" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
              <Phone size={20} />
            </Button>
            <Button variant="ghost" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
              <Video size={20} />
            </Button>
            <Button variant="ghost" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
              <MoreVertical size={20} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <MotionDiv
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.sender === 'user'
                      ? 'bg-[var(--color-primary)] text-white'
                      : msg.isError
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-500'
                        : (type === 'ai' || type === 'document')
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {msg.sender === 'user'
                      ? <User size={14} />
                      : msg.isError
                        ? <AlertCircle size={14} />
                        : (type === 'ai' || type === 'document')
                          ? <Bot size={14} />
                          : <User size={14} />}
                  </div>

                  <div className={`rounded-2xl p-4 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[var(--color-primary)] text-white rounded-br-none'
                      : msg.isError
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-bl-none'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                  }`}>
                    <p className="leading-relaxed text-[15px] whitespace-pre-wrap">{msg.text}</p>
                    <span className={`text-[10px] mt-1.5 block font-medium opacity-70 ${msg.sender === 'user' ? 'text-blue-100 text-right' : 'text-slate-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </MotionDiv>
            ))}
          </AnimatePresence>

          {/* Typing / Loading indicator */}
          {isLoading && (
            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-end gap-2">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  type === 'ai' || type === 'document'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  <Bot size={14} />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </MotionDiv>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 md:p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
          <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 flex items-end gap-2 shadow-inner">
            <Button variant="ghost" className="text-slate-400 hover:text-[var(--color-primary)] p-3 rounded-full hover:bg-white dark:hover:bg-slate-800 h-auto">
              <Paperclip size={20} />
            </Button>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chat_interface.input_placeholder')}
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-800 dark:text-white placeholder:text-slate-400 resize-none py-3 max-h-32 min-h-[48px] disabled:opacity-50"
              rows="1"
            />

            <div className="flex items-center gap-1">
              <Button variant="ghost" className="text-slate-400 hover:text-[var(--color-primary)] p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 h-auto hidden sm:flex">
                <Smile size={20} />
              </Button>
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={`p-3 rounded-full transition-all duration-300 h-auto ${
                  inputValue.trim() && !isLoading
                    ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                {isLoading
                  ? <Loader2 size={20} className="animate-spin" />
                  : <Send size={20} className={inputValue.trim() ? 'translate-x-0.5' : ''} />
                }
              </Button>
            </div>
          </div>
          {(type === 'ai' || type === 'document') && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={handoffLoading || isLoading}
                onClick={() => handoffToAdmin({
                  firstMessage: messages.length
                    ? `Oxirgi murojaat: ${messages[messages.length - 1].text}`
                    : '',
                })}
                className="text-xs py-2 h-auto"
              >
                {handoffLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                Adminga ulash
              </Button>
              {handoffError && (
                <span className="text-xs text-red-500 dark:text-red-400 inline-flex items-center gap-1">
                  <AlertCircle size={13} />
                  {handoffError}
                </span>
              )}
            </div>
          )}
          <div className="text-center mt-2">
            <p className="text-xs text-slate-400">{t('chat_interface.ai_warning')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
