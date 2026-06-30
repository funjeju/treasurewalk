'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { GameMapDynamic } from '@/components/map/GameMapDynamic';
import { createTreasure, uploadHintPhoto } from '@/lib/firebase/treasures';
import type { GeoPoint } from '@/lib/types';

const DEFAULT_CENTER: GeoPoint = { lat: 37.5665, lng: 126.978 }; // 서울 시청 fallback

export default function NewTreasurePage() {
  const t = useTranslations('treasure');
  const tc = useTranslations('common');
  const { user, family, children } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [center, setCenter] = useState<GeoPoint>(DEFAULT_CENTER);
  const [picked, setPicked] = useState<GeoPoint | null>(null);
  const [radiusM, setRadiusM] = useState(40);
  const [amount, setAmount] = useState<number>(1000);
  const [title, setTitle] = useState('');
  const [assignedChildId, setAssignedChildId] = useState<string>('');
  const [hintFile, setHintFile] = useState<File | null>(null);
  const [hintPreview, setHintPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(here);
        setPicked(here);
      },
      () => {
        /* 권한 거부 시 fallback 유지 */
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setHintFile(f);
    if (hintPreview) URL.revokeObjectURL(hintPreview);
    setHintPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit() {
    setError(null);
    if (!user || !family) return;
    const loc = picked ?? center;
    if (!loc) return setError(t('missingLocation'));
    if (!hintFile) return setError(t('missingHint'));
    if (!amount || amount <= 0) return setError(t('missingReward'));

    setBusy(true);
    try {
      const hintPhotoUrl = await uploadHintPhoto(family.id, hintFile);
      await createTreasure(family.id, {
        location: loc,
        radiusM,
        amount,
        hintPhotoUrl,
        title: title.trim() || undefined,
        assignedChildId: assignedChildId || null,
        createdByUid: user.uid,
      });
      router.replace('/dashboard');
    } catch (e) {
      console.error(e);
      setError(tc('error'));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{t('newTitle')}</h1>

      {/* 1. 위치 */}
      <section className="tq-panel p-4">
        <h2 className="font-bold">{t('stepLocation')}</h2>
        <p className="mb-3 text-sm text-[var(--tq-ink-soft)]">
          {t('stepLocationHint')}
        </p>
        <div className="h-72 w-full overflow-hidden rounded-[18px]">
          <GameMapDynamic
            center={picked ?? center}
            zoom={16}
            pickMode
            pickRadiusM={radiusM}
            onPick={(p) => setPicked(p)}
          />
        </div>
        <button
          type="button"
          className="tq-btn tq-btn-secondary mt-3"
          onClick={() => {
            navigator.geolocation?.getCurrentPosition((pos) => {
              const here = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              };
              setCenter(here);
              setPicked(here);
            });
          }}
        >
          📍 {t('useMyLocation')}
        </button>
      </section>

      {/* 2. 반경 */}
      <section className="tq-panel p-4">
        <h2 className="font-bold">{t('stepRadius')}</h2>
        <p className="mb-3 text-sm text-[var(--tq-ink-soft)]">{t('radiusHint')}</p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={30}
            max={50}
            step={5}
            value={radiusM}
            onChange={(e) => setRadiusM(Number(e.target.value))}
            className="flex-1"
            aria-label={t('stepRadius')}
          />
          <span className="tq-pill">{radiusM}m</span>
        </div>
      </section>

      {/* 3. 힌트 사진 */}
      <section className="tq-panel p-4">
        <h2 className="font-bold">{t('stepHint')}</h2>
        <p className="mb-3 text-sm text-[var(--tq-ink-soft)]">{t('hintHelp')}</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="tq-btn tq-btn-secondary"
            onClick={() => fileRef.current?.click()}
          >
            🖼️ {t('hintUpload')}
          </button>
          {hintPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hintPreview}
              alt=""
              className="h-16 w-16 rounded-[10px] object-cover"
            />
          )}
        </div>
      </section>

      {/* 4. 용돈 + 메타 */}
      <section className="tq-panel space-y-4 p-4">
        <div>
          <h2 className="font-bold">{t('stepReward')}</h2>
          <p className="mb-2 text-sm text-[var(--tq-ink-soft)]">{t('rewardHint')}</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={100}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="tq-input max-w-40"
              aria-label={t('rewardAmount')}
            />
            <span className="font-bold">{tc('krw')}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold">{t('titleLabel')}</label>
          <input
            className="tq-input mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
          />
        </div>

        {children.length > 0 && (
          <div>
            <label className="block text-sm font-bold">{t('assignChild')}</label>
            <select
              className="tq-input mt-1"
              value={assignedChildId}
              onChange={(e) => setAssignedChildId(e.target.value)}
            >
              <option value="">—</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {error && (
        <p className="text-sm font-semibold text-[var(--tq-ruby)]">{error}</p>
      )}

      <div className="sticky bottom-3 flex gap-2">
        <button
          type="button"
          className="tq-btn tq-btn-secondary"
          onClick={() => router.back()}
        >
          {tc('cancel')}
        </button>
        <button
          type="button"
          className="tq-btn tq-btn-primary flex-1"
          onClick={handleSubmit}
          disabled={busy}
        >
          {busy ? t('hiding') : `🗺️ ${t('hideButton')}`}
        </button>
      </div>
    </div>
  );
}
