import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  LogOut,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import SupportChat from '../components/chat/SupportChat';

const LOCAL_APPLICATIONS_KEY = 'legallink_user_applications_v1';
const LAWYER_AVAILABILITY_KEY = 'legallink_lawyer_availability_v1';

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const TABS = [
  { key: 'applications', label: 'Arizalar' },
  { key: 'schedule', label: 'Bo‘sh vaqtlar' },
  { key: 'chat', label: 'Chat' },
];

const getLawyerKey = (user) => String(user?.lawyerId || user?.email || user?.id || '').trim();

export default function LawyerDashboard() {
  const navigate = useNavigate();
  const { user, logout, listSupportConversations, safeError } = useAuth();

  const lawyerKey = useMemo(() => getLawyerKey(user), [user]);
  const [activeTab, setActiveTab] = useState('applications');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [applications, setApplications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotForm, setSlotForm] = useState({
    date: '',
    start: '09:00',
    end: '10:00',
  });

  const loadData = useCallback(async () => {
    if (!lawyerKey) return;

    setLoading(true);
    setError('');

    try {
      const allApplications = readJSON(LOCAL_APPLICATIONS_KEY, []);
      const myApplications = allApplications.filter((item) => {
        const assignedId = String(item?.assignedLawyerId || item?.lawyerId || '').trim();
        const assignedEmail = String(item?.assignedLawyerEmail || item?.lawyerEmail || '').trim().toLowerCase();
        return assignedId === lawyerKey || assignedEmail === String(user?.email || '').toLowerCase();
      });
      setApplications(myApplications);

      const availabilityMap = readJSON(LAWYER_AVAILABILITY_KEY, {});
      setSlots(Array.isArray(availabilityMap[lawyerKey]) ? availabilityMap[lawyerKey] : []);

      const chatList = await listSupportConversations();
      setConversations(Array.isArray(chatList) ? chatList : []);
    } catch (err) {
      setError(safeError(err, "Advokat kabinet ma'lumotlarini yuklashda xatolik"));
    } finally {
      setLoading(false);
    }
  }, [lawyerKey, listSupportConversations, safeError, user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const pendingApplications = applications.filter((item) => !['resolved', 'closed'].includes(String(item?.status || '').toLowerCase())).length;
    const pendingChatApprovals = applications.filter((item) => item?.chatApproved === false).length;
    const activeChats = conversations.filter((item) => String(item?.status || '').toLowerCase() !== 'closed').length;

    return {
      pendingApplications,
      pendingChatApprovals,
      activeChats,
      slots: slots.length,
    };
  }, [applications, conversations, slots.length]);

  const persistSlots = (nextSlots) => {
    setSlots(nextSlots);
    const availabilityMap = readJSON(LAWYER_AVAILABILITY_KEY, {});
    availabilityMap[lawyerKey] = nextSlots;
    writeJSON(LAWYER_AVAILABILITY_KEY, availabilityMap);
  };

  const updateApplicationStatus = (id, status) => {
    const all = readJSON(LOCAL_APPLICATIONS_KEY, []);
    const next = all.map((item) => {
      if (String(item.id || item._id) !== String(id)) return item;
      return {
        ...item,
        status,
        lawyerUpdatedAt: new Date().toISOString(),
      };
    });
    writeJSON(LOCAL_APPLICATIONS_KEY, next);

    setApplications((prev) => prev.map((item) => (
      String(item.id || item._id) === String(id) ? { ...item, status } : item
    )));
    setNotice(`Ariza holati yangilandi: ${status}`);
  };

  const handleAddSlot = (event) => {
    event.preventDefault();
    if (!slotForm.date || !slotForm.start || !slotForm.end) {
      setError('Sana va vaqtlarni to‘liq kiriting');
      return;
    }
    if (slotForm.start >= slotForm.end) {
      setError('Boshlanish vaqti tugash vaqtidan kichik bo‘lishi kerak');
      return;
    }

    const newSlot = {
      id: `slot_${Date.now()}`,
      date: slotForm.date,
      start: slotForm.start,
      end: slotForm.end,
      status: 'available',
      createdAt: new Date().toISOString(),
    };

    const next = [newSlot, ...slots].sort(
      (a, b) => new Date(`${a.date}T${a.start}`).getTime() - new Date(`${b.date}T${b.start}`).getTime()
    );
    persistSlots(next);
    setSlotForm({ date: '', start: '09:00', end: '10:00' });
    setError('');
    setNotice('Bo‘sh vaqt muvaffaqiyatli qo‘shildi');
  };

  const handleDeleteSlot = (slotId) => {
    const next = slots.filter((slot) => String(slot.id) !== String(slotId));
    persistSlots(next);
    setNotice('Bo‘sh vaqt o‘chirildi');
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">
              Advokat kabineti
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              Arizalar, bo‘sh vaqtlar va tasdiqlangan chatlar boshqaruvi
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadData} className="gap-2">
              <RefreshCw size={16} /> Yangilash
            </Button>
            <Button onClick={handleLogout} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
              <LogOut size={16} className="mr-2" /> Chiqish
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-7">
          <StatBox icon={ShieldCheck} title="Jarayondagi ariza" value={stats.pendingApplications} />
          <StatBox icon={Clock3} title="Chat tasdiq kutmoqda" value={stats.pendingChatApprovals} />
          <StatBox icon={MessageSquare} title="Faol chat" value={stats.activeChats} />
          <StatBox icon={CalendarClock} title="Bo‘sh vaqtlar" value={stats.slots} />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                activeTab === item.key
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-10 flex flex-col items-center text-slate-500">
            <RefreshCw size={30} className="animate-spin mb-3" />
            Yuklanmoqda...
          </div>
        ) : (
          <>
            {activeTab === 'applications' && (
              <Card title="Menga biriktirilgan arizalar">
                {applications.length === 0 ? (
                  <Empty text="Hali sizga biriktirilgan ariza yo‘q." />
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                    {applications.map((item, idx) => (
                      <div key={String(item.id || item._id || idx)} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white">{item.title || item.subject || 'Nomsiz ariza'}</p>
                          <select
                            className="text-xs rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2 py-1"
                            value={item.status || 'assigned'}
                            onChange={(event) => updateApplicationStatus(item.id || item._id, event.target.value)}
                          >
                            <option value="assigned">assigned</option>
                            <option value="in_review">in_review</option>
                            <option value="resolved">resolved</option>
                            <option value="closed">closed</option>
                          </select>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{item.description || item.text || '-'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-md ${
                            item.chatApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.chatApproved ? 'Chat ruxsati bor' : 'Chat admin ruxsatini kutmoqda'}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200">
                            Mijoz: {item.userEmail || item.clientEmail || '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'schedule' && (
              <div className="grid lg:grid-cols-2 gap-5">
                <Card title="Bo‘sh vaqt qo‘shish">
                  <form onSubmit={handleAddSlot} className="space-y-3">
                    <Field label="Sana">
                      <input
                        type="date"
                        value={slotForm.date}
                        onChange={(event) => setSlotForm((prev) => ({ ...prev, date: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
                        required
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Boshlanish">
                        <input
                          type="time"
                          value={slotForm.start}
                          onChange={(event) => setSlotForm((prev) => ({ ...prev, start: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
                          required
                        />
                      </Field>
                      <Field label="Tugash">
                        <input
                          type="time"
                          value={slotForm.end}
                          onChange={(event) => setSlotForm((prev) => ({ ...prev, end: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
                          required
                        />
                      </Field>
                    </div>
                    <Button type="submit" className="btn-primary w-full">
                      <CheckCircle2 size={16} className="mr-2" /> Vaqt qo‘shish
                    </Button>
                  </form>
                </Card>

                <Card title="Belgilangan bo‘sh vaqtlar">
                  {slots.length === 0 ? (
                    <Empty text="Bo‘sh vaqtlar hali qo‘shilmagan." />
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                      {slots.map((slot) => (
                        <div key={slot.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{slot.date}</p>
                            <p className="text-xs text-slate-500">{slot.start} - {slot.end}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            O‘chirish
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'chat' && (
              <Card title="Mijozlar bilan chat">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Chat faqat admin ruxsat bergan suhbatlarda ochiladi.
                </p>
                <SupportChat embedded />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 inline-flex items-center gap-2">
        <ShieldCheck size={18} className="text-[var(--color-primary)] dark:text-blue-400" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatBox({ icon, title, value }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center">
        {React.createElement(icon, { size: 20 })}
      </div>
      <div>
        <p className="text-xs text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Empty({ text }) {
  return (
    <div className="py-10 text-center text-sm text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
      {text}
    </div>
  );
}
