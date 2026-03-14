/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { lawyers as seedLawyers } from '../data/lawyers';
import { useAuth } from './AuthContext';

const LawyersContext = createContext();

const STORAGE_KEY = 'advokat_lawyers_v1';

const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStored = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeLawyer = (raw = {}) => {
  const idCandidate = raw.id || raw._id || raw.lawyerId || `lawyer_${Date.now()}`;

  const location = raw.location && typeof raw.location === 'object'
    ? raw.location
    : { city: raw.city || 'toshkent', district: raw.district || '' };

  const casesRaw = raw.cases || {};

  return {
    id: typeof idCandidate === 'number' ? idCandidate : String(idCandidate),
    name: raw.name || 'Yangi advokat',
    specialization: raw.specialization || 'civil',
    rating: toNumber(raw.rating, 4.8),
    reviews: toNumber(raw.reviews, 0),
    cases: {
      total: toNumber(casesRaw.total, toNumber(raw.totalCases, 0)),
      won: toNumber(casesRaw.won, toNumber(raw.wonCases, 0)),
    },
    location: {
      city: location.city || 'toshkent',
      district: location.district || '',
    },
    image: raw.image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800',
    level: raw.level || 'first',
    experience: toNumber(raw.experience, 1),
    languages: Array.isArray(raw.languages)
      ? raw.languages
      : String(raw.languages || "O'zbek")
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
    license: raw.license || '-',
    workHours: raw.workHours || '09:00 - 18:00',
    bio: raw.bio || `${raw.name || 'Advokat'} bo'yicha to'liq ma'lumot keyinroq qo'shiladi.`,
    email: raw.email || '',
    phone: raw.phone || '',
    telegram: raw.telegram || '',
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
};

const normalizeList = (input) => {
  if (!Array.isArray(input)) return [];
  return input.map(normalizeLawyer);
};

const getNextNumericId = (list) => {
  const max = list.reduce((acc, item) => {
    const val = Number(item.id);
    return Number.isFinite(val) ? Math.max(acc, val) : acc;
  }, 0);

  return max + 1;
};

const endpointCandidates = ['/api/lawyers', '/lawyers'];

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data?.message || data?.error || `Server xatosi: ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return data;
}

export const LawyersProvider = ({ children }) => {
  const { apiBase, authToken, user } = useAuth();
  const [lawyers, setLawyers] = useState(() => {
    const stored = readStored();
    const list = stored?.length ? stored : seedLawyers;
    return normalizeList(list);
  });
  const [loadingLawyers, setLoadingLawyers] = useState(true);
  const [lawyersError, setLawyersError] = useState(null);

  useEffect(() => {
    writeStored(lawyers);
  }, [lawyers]);

  const requestAny = async ({ method = 'GET', body, withAuth = false, suffix = '' }) => {
    let lastError = null;

    for (const basePath of endpointCandidates) {
      const path = `${basePath}${suffix}`;
      try {
        const res = await fetch(`${apiBase}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(withAuth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await parseResponse(res);
        return data;
      } catch (err) {
        lastError = err;
        if ([404, 405].includes(err?.status)) continue;
        throw err;
      }
    }

    throw lastError || new Error('Endpoint topilmadi');
  };

  const refreshLawyers = async () => {
    setLoadingLawyers(true);
    setLawyersError(null);

    try {
      const data = await requestAny({ method: 'GET' });
      const list = Array.isArray(data) ? data : (data.lawyers || data.data || data.items || []);
      const normalized = normalizeList(list);
      if (normalized.length) {
        setLawyers(normalized);
      }
    } catch (err) {
      setLawyersError(err.message || 'Serverdan advokatlar ro\'yxatini olib bo\'lmadi');
    } finally {
      setLoadingLawyers(false);
    }
  };

  useEffect(() => {
    refreshLawyers();
    // refreshLawyers includes runtime auth data; initial load is enough here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assertAdmin = () => {
    if (!user || user.role !== 'admin') {
      throw new Error('Faqat admin bu amalni bajarishi mumkin');
    }
  };

  const createLawyer = async (payload) => {
    assertAdmin();

    const cleaned = normalizeLawyer(payload);

    try {
      const data = await requestAny({ method: 'POST', body: cleaned, withAuth: true });
      const created = normalizeLawyer(data.lawyer || data.data || data);
      setLawyers((prev) => {
        const next = [created, ...prev.filter((item) => String(item.id) !== String(created.id))];
        return next;
      });
      return created;
    } catch {
      const localCreated = {
        ...cleaned,
        id: getNextNumericId(lawyers),
        created_at: new Date().toISOString(),
      };

      setLawyers((prev) => [localCreated, ...prev]);
      return localCreated;
    }
  };

  const updateLawyer = async (id, payload) => {
    assertAdmin();

    const target = lawyers.find((item) => String(item.id) === String(id));
    if (!target) throw new Error('Advokat topilmadi');

    const cleaned = normalizeLawyer({ ...target, ...payload, id: target.id });

    try {
      const data = await requestAny({
        method: 'PATCH',
        body: cleaned,
        withAuth: true,
        suffix: `/${id}`,
      });

      const updated = normalizeLawyer(data.lawyer || data.data || data);
      setLawyers((prev) => prev.map((item) => (String(item.id) === String(id) ? updated : item)));
      return updated;
    } catch {
      setLawyers((prev) => prev.map((item) => (String(item.id) === String(id) ? cleaned : item)));
      return cleaned;
    }
  };

  const deleteLawyer = async (id) => {
    assertAdmin();

    try {
      await requestAny({
        method: 'DELETE',
        withAuth: true,
        suffix: `/${id}`,
      });
    } catch {
      // local fallback mode
    }

    setLawyers((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  const getLawyerById = (id) => lawyers.find((item) => String(item.id) === String(id)) || null;

  const value = {
    lawyers,
    loadingLawyers,
    lawyersError,
    refreshLawyers,
    createLawyer,
    updateLawyer,
    deleteLawyer,
    getLawyerById,
  };

  return <LawyersContext.Provider value={value}>{children}</LawyersContext.Provider>;
};

export const useLawyers = () => {
  const context = useContext(LawyersContext);
  if (!context) {
    throw new Error('useLawyers must be used inside LawyersProvider');
  }
  return context;
};
