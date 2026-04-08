import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Handshake,
  LockKeyhole,
  MapPinned,
  Scale,
  ShieldCheck,
  Users2,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { buildApiUrl } from '../config/appConfig';

const LOCAL_USERS_KEY = 'advokat_local_users_v1';
const LOCAL_APPLICATIONS_KEY = 'legallink_user_applications_v1';

const CORE_PRINCIPLES = [
  {
    title: 'Advokat markazli xizmat sifati',
    text: 'Platformadagi har bir ish malakali advokat nazorati ostida yuritiladi.',
    icon: Scale,
  },
  {
    title: 'Hujjat va jarayon intizomi',
    text: 'Ariza, fayl, status va keyingi qadamlar bitta kabinet ichida boshqariladi.',
    icon: FileCheck2,
  },
  {
    title: 'Maxfiylik standarti',
    text: 'Mijoz ma\'lumotlari va suhbatlar ruxsatga asoslangan yopiq oqimda saqlanadi.',
    icon: LockKeyhole,
  },
  {
    title: 'Natijaga yo\'naltirilgan yondashuv',
    text: 'Maqsad faqat javob berish emas, amaliy yakun va real huquqiy yechimga chiqishdir.',
    icon: Handshake,
  },
];

const WORKFLOW = [
  {
    title: '01. Dastlabki aniqlashtirish',
    text: 'Foydalanuvchi murojaati tizimga tushadi va holat bo\'yicha boshlang\'ich yo\'nalish olinadi.',
  },
  {
    title: '02. Triage va baholash',
    text: 'Risk darajasi, yo\'nalish va hujjatlar checklisti shakllantiriladi.',
  },
  {
    title: '03. Advokatga biriktirish',
    text: 'Mos ixtisoslik va reyting asosida murojaat advokat kabinetiga uzatiladi.',
  },
  {
    title: '04. Jarayon monitoringi',
    text: 'Mijoz kabinetida holat, chat va hujjatlar oqimi izchil kuzatib boriladi.',
  },
];

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const extractList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const fetchAny = async (paths) => {
  let lastError = null;
  for (const path of paths) {
    try {
      const response = await fetch(buildApiUrl(path));
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const err = new Error(data?.message || data?.error || `Server xatosi: ${response.status}`);
        err.status = response.status;
        throw err;
      }
      return data;
    } catch (err) {
      lastError = err;
      if (err?.status === 404 || err?.status === 405) continue;
      throw err;
    }
  }
  throw lastError || new Error('Endpoint topilmadi');
};

function MetricCard({ title, value, icon: Icon, loading }) {
  const iconNode = React.createElement(Icon, { size: 13 });

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4">
      <p className="text-[11px] uppercase tracking-wide text-blue-100 inline-flex items-center gap-1.5">
        {iconNode}
        {title}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-20 rounded bg-white/20 animate-pulse" />
      ) : (
        <p className="mt-2 text-2xl font-black text-white">{value}</p>
      )}
    </div>
  );
}

function PrincipleCard({ title, text, icon: Icon }) {
  const iconNode = React.createElement(Icon, {
    size: 20,
    className: 'text-[var(--color-primary)] dark:text-blue-300',
  });

  return (
    <article className="surface-card rounded-2xl p-5">
      <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-50)] dark:bg-slate-700 inline-flex items-center justify-center">
        {iconNode}
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{text}</p>
    </article>
  );
}

export default function About() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      setLoading(true);

      const localUsers = toArray(readJSON(LOCAL_USERS_KEY, []));
      const localApps = toArray(readJSON(LOCAL_APPLICATIONS_KEY, []));

      const local = {
        totalUsers: localUsers.length,
        totalLawyers: localUsers.filter((item) => String(item?.role || '').toLowerCase() === 'lawyer').length,
        resolvedCases: localApps.filter((item) => ['resolved', 'closed'].includes(String(item?.status || '').toLowerCase())).length,
        todayRequests: localApps.filter((item) => {
          const ts = new Date(item?.createdAt || item?.created_at || item?.submittedAt || '').getTime();
          if (!Number.isFinite(ts)) return false;
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          return ts >= start;
        }).length,
      };

      try {
        const [usersRes, lawyersRes, appsRes] = await Promise.all([
          fetchAny(['/admin/user/users/count', '/admin/user/users/search?q=@', '/users', '/users/', '/auth/users']),
          fetchAny(['/admin/user/lawyers/count', '/advokat/lawyers', '/advokat/list', '/advokat', '/lawyers', '/api/lawyers']),
          fetchAny(['/admin/ariza/requests', '/user/ariza/my', '/applications', '/api/applications', '/documents', '/api/documents']),
        ]);

        const users = extractList(usersRes, ['users', 'items']);
        const lawyers = extractList(lawyersRes, ['lawyers', 'items']);
        const apps = extractList(appsRes, ['applications', 'documents', 'items']);

        const todayStart = (() => {
          const now = new Date();
          return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        })();

        const resolved = apps.filter((item) => ['resolved', 'closed'].includes(String(item?.status || '').toLowerCase())).length;
        const today = apps.filter((item) => {
          const ts = new Date(item?.createdAt || item?.created_at || item?.submittedAt || '').getTime();
          return Number.isFinite(ts) && ts >= todayStart;
        }).length;

        if (!active) return;
        setStats({
          totalUsers: users.length || local.totalUsers,
          totalLawyers: lawyers.length || local.totalLawyers,
          resolvedCases: resolved || local.resolvedCases,
          todayRequests: today || local.todayRequests,
        });
      } catch {
        if (!active) return;
        setStats(local);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadStats();
    return () => {
      active = false;
    };
  }, []);

  const kpis = useMemo(() => {
    const users = Number(stats?.totalUsers || 0);
    const lawyers = Number(stats?.totalLawyers || 0);
    const resolvedCases = Number(stats?.resolvedCases || 0);
    const todayRequests = Number(stats?.todayRequests || 0);

    const nf = new Intl.NumberFormat('uz-UZ');
    const resolvedRate = users > 0 ? `${Math.min(100, Math.round((resolvedCases / users) * 100))}%` : '0%';

    return {
      users: users > 0 ? `${nf.format(users)}+` : '0',
      lawyers: lawyers > 0 ? `${nf.format(lawyers)}+` : '0',
      resolvedCases: resolvedCases > 0 ? `${nf.format(resolvedCases)}+` : '0',
      todayRequests: todayRequests > 0 ? `${nf.format(todayRequests)}+` : '0',
      resolvedRate,
    };
  }, [stats?.resolvedCases, stats?.todayRequests, stats?.totalLawyers, stats?.totalUsers]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <section className="pt-28 pb-10 md:pt-32 md:pb-14">
        <div className="section-wrap">
          <div className="rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-[#0f2f57] via-[#164d88] to-[#0f3a67] text-white relative">
            <div className="absolute -top-24 -right-12 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 left-0 w-72 h-72 rounded-full bg-[#d4a966]/25 blur-3xl" />

            <div className="relative grid lg:grid-cols-[1.2fr_0.8fr] gap-6 p-6 md:p-9">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-semibold tracking-wide">
                  <ShieldCheck size={14} />
                  LegalLink haqida
                </span>
                <h1 className="mt-4 text-3xl md:text-5xl font-serif font-bold leading-tight">
                  Raqamli platforma,
                  <br />
                  real advokatlar jamoasi
                </h1>
                <p className="mt-4 text-slate-100 max-w-2xl leading-relaxed">
                  Biz huquqiy xizmatni oddiylashtiramiz: mijoz murojaati, case baholash, advokatga biriktirish
                  va natijagacha kuzatuv bitta ekotizimda ishlaydi.
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link to="/lawyers">
                    <Button className="h-11 px-6 text-sm">Advokatlarni ko'rish</Button>
                  </Link>
                  <Link to="/chat/ai">
                    <Button variant="outline" className="h-11 px-6 text-sm border-white/40 text-white hover:bg-white/10">
                      Yuridik chat
                      <ArrowRight size={15} className="ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 self-start">
                <MetricCard title="Foydalanuvchilar" value={kpis.users} icon={Users2} loading={loading} />
                <MetricCard title="Faol advokatlar" value={kpis.lawyers} icon={Scale} loading={loading} />
                <MetricCard title="Yakunlangan ish" value={kpis.resolvedCases} icon={BadgeCheck} loading={loading} />
                <MetricCard title="Bugungi murojaat" value={kpis.todayRequests} icon={Clock3} loading={loading} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10 md:pb-14">
        <div className="section-wrap">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-4">
            <div className="surface-card rounded-3xl p-5 md:p-6">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Ishonch indikatori</p>
              <h2 className="mt-2 text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">
                Platforma real jarayonga qurilgan
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Bizning ustunlik dizaynda emas, ichki operatsion modelda: nazorat, javobgarlik va kuzatuv.
              </p>

              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {CORE_PRINCIPLES.map((item) => (
                  <PrincipleCard key={item.title} title={item.title} text={item.text} icon={item.icon} />
                ))}
              </div>
            </div>

            <div className="surface-card rounded-3xl p-5 md:p-6">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Operatsion model</p>
              <h3 className="mt-2 text-2xl font-serif font-bold text-slate-900 dark:text-white">Biz qanday ishlaymiz</h3>

              <div className="mt-4 space-y-3">
                {WORKFLOW.map((item) => (
                  <article key={item.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.text}</p>
                  </article>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Joriy ijobiy hal ko'rsatkichi: {kpis.resolvedRate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10 md:pb-16">
        <div className="section-wrap">
          <div className="surface-card rounded-3xl p-5 md:p-6">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Hududiy qamrov</p>
            <h3 className="mt-2 text-2xl font-serif font-bold text-slate-900 dark:text-white">Ofis va aloqa standarti</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Mijozlarga masofadan va oflayn formatda xizmat ko'rsatamiz. Asosiy tamoyil: tezkor aloqa, aniq hujjat oqimi, status bo'yicha shaffoflik.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <li className="inline-flex items-start gap-2"><Building2 size={15} className="mt-0.5 text-[var(--color-primary)]" /> Markaziy koordinatsiya va hududiy yurist tarmog'i</li>
              <li className="inline-flex items-start gap-2"><MapPinned size={15} className="mt-0.5 text-[var(--color-primary)]" /> Toshkent va viloyatlar kesimida case yuritish amaliyoti</li>
              <li className="inline-flex items-start gap-2"><ShieldCheck size={15} className="mt-0.5 text-[var(--color-primary)]" /> Maxfiylik va hujjat aylanishi bo'yicha ichki standart</li>
            </ul>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link to="/contact">
                <Button className="h-11 px-6 text-sm">Aloqa markazi</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" className="h-11 px-6 text-sm">Shaxsiy kabinet</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
