import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileCheck2, Scale, ShieldCheck, Timer } from 'lucide-react';
import Button from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';

const FEATURE_CHIPS = [
  { icon: Timer, text: 'Tez yo‘naltirish' },
  { icon: FileCheck2, text: 'Hujjat nazorati' },
  { icon: ShieldCheck, text: 'Maxfiy aloqa' },
];

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden min-h-screen pt-28 md:pt-32 pb-10 md:pb-14 flex items-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(22,77,136,0.2),transparent_52%),radial-gradient(circle_at_80%_0%,rgba(212,169,102,0.22),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef3fa_100%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(32,78,131,0.35),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(212,169,102,0.18),transparent_36%),linear-gradient(180deg,#0f172a_0%,#111f35_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(100,116,139,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.14)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative section-wrap w-full">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-primary-300)] bg-white/70 dark:bg-slate-900/60 text-[var(--color-primary)] dark:text-blue-300 text-xs font-semibold">
              <Scale size={14} />
              Huquqiy platforma
            </span>

            <h1 className="mt-5 text-4xl md:text-6xl font-serif font-bold leading-[1.05] text-slate-900 dark:text-white">
              {t('hero.title')}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {FEATURE_CHIPS.map((chip) => (
                <span
                  key={chip.text}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                >
                  <chip.icon size={13} />
                  {chip.text}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/chat/ai">
                <Button className="px-7 h-12 text-sm">
                  {t('hero.search_btn')}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
              <Link to="/lawyers">
                <Button variant="outline" className="px-7 h-12 text-sm">
                  Advokat tanlash
                </Button>
              </Link>
            </div>
          </div>

          <div className="surface-card p-5 md:p-6">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">
              Platforma imkoniyatlari
            </p>
            <h3 className="mt-2 text-2xl font-serif font-bold text-slate-900 dark:text-white">
              Har bir murojaat bo‘yicha aniq ish tartibi
            </h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              AI boshlang‘ich javob beradi, keyin zarur bo‘lsa mutaxassis advokatga biriktirish va chat orqali davom ettirish mumkin.
            </p>

            <div className="mt-5 space-y-2">
              <QuickLine text="Mijoz arizasi tizimda saqlanadi" />
              <QuickLine text="Admin va advokat paneli bog‘langan" />
              <QuickLine text="Hujjat oqimi va tarix bir joyda" />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Maslahat</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Shoshilinch holatlarda bevosita advokat bilan chat ochish tavsiya etiladi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickLine({ text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
      <span>{text}</span>
    </div>
  );
}
