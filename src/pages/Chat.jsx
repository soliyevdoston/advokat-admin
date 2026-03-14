import React from 'react';
import { useParams } from 'react-router-dom';
import ChatInterface from '../components/chat/ChatInterface';
import SupportChat from '../components/chat/SupportChat';
import { useLawyers } from '../context/LawyersContext';

/**
 * ChatPage — /chat/:type va /chat/:type/:id
 *
 * type:
 * - ai       -> Advokat AI yordamchisi
 * - support  -> Admin / support chat
 * - lawyer   -> Advokat bo'yicha admin bilan chat
 * - document -> Hujjat generatori
 */
export default function ChatPage() {
  const { type, id } = useParams();
  const { getLawyerById } = useLawyers();

  if (type === 'support' || type === 'lawyer') {
    return (
      <div className="pt-28 pb-20 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SupportChat lawyerId={type === 'lawyer' ? id : null} />
        </div>
      </div>
    );
  }

  let title = 'Advokat yordamchisi';
  let subtitle = 'Savollaringizga javob beraman';
  let initial = 'Assalomu alaykum! Sizga qanday yuridik yordam kerak?';
  let chatType = 'ai';

  if (type === 'document') {
    title = 'Hujjatlar Generatori';
    subtitle = 'AI yordamida hujjat yarating';
    initial = "Qanday hujjat tayyorlashimiz kerak? (Masalan: Ariza, Da'vo arizasi, Shartnoma)";
    chatType = 'document';
  } else if (type === 'lawyer' && id) {
    const lawyer = getLawyerById(id);
    if (lawyer) {
      title = `Advokat ${lawyer.name} bo'yicha yordam`;
      subtitle = 'Platforma mutaxassisi bilan muloqot';
      initial = `Assalomu alaykum! Siz advokat ${lawyer.name} bo'yicha murojaat qoldirdingiz. Holatingizni batafsil yozib qoldiring.`;
      chatType = 'expert';
    }
  }

  return (
    <div className="pt-28 pb-20 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ChatInterface
          title={title}
          subtitle={subtitle}
          type={chatType}
          initialMessage={initial}
        />
      </div>
    </div>
  );
}
