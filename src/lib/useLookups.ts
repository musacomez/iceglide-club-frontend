'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Lookups } from '@/types/api';

// Seçim listeleri (eğitmen, lokasyon, grup...) sık değişmez; oturum boyunca
// bir kez çekip bellekte tutuyoruz. Yeni kayıt eklenince `reload` çağrılabilir.
let cache: Lookups | null = null;

export function useLookups() {
  const [data, setData] = useState<Lookups | null>(cache);
  const [error, setError] = useState<string | null>(null);

  const load = async (force = false) => {
    if (cache && !force) {
      setData(cache);
      return;
    }
    setError(null);
    try {
      cache = await api.getLookups();
      setData(cache);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Seçim listeleri yüklenemedi.');
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, error, reload: () => load(true) };
}
