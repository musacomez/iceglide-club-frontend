'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal'; // Kendi Modal bileşeniniz
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api/endpoints';

interface NewLessonModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialDate?: string; // YYYY-MM-DD
  initialStartTime?: string; // HH:MM
}

export function NewLessonModal({
  open,
  onClose,
  onCreated,
  initialDate = '',
  initialStartTime = '09:00',
}: NewLessonModalProps) {
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(() => {
    // Varsayılan olarak 1 saat sonrası
    const [h, m] = initialStartTime.split(':').map(Number);
    const endH = String((h + 1) % 24).padStart(2, '0');
    return `${endH}:${String(m).padStart(2, '0')}`;
  });
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // API isteğinize uygun olarak payload'ı düzenleyin
      await api.createLesson({
        title,
        lesson_date: date,
        start_time: startTime,
        end_time: endTime,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ders eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Yeni Ders Ekle">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-600 border border-rose-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Ders / Başlık
          </label>
          <input
            type="text"
            required
            placeholder="Örn: Özel Paten Dersi"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tarih
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Başlangıç Saati
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bitiş Saati
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Ders Oluştur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
