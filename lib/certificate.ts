'use client';

export interface CertificateData {
  titleLabel: string;
  explorerLabel: string;
  explorerName: string;
  foundAtLabel: string;
  foundAt: string;
  stepsLabel: string;
  steps: number;
  amountLabel: string;
  amount: string;
  idLabel: string;
  discoveryId: string;
}

/**
 * 인증서 PNG 생성 (docs/04 §3.3). 양피지 톤 canvas → Blob.
 * 클라이언트 전용.
 */
export async function generateCertificate(d: CertificateData): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  // 배경 — 양피지
  ctx.fillStyle = '#FAEEDA';
  ctx.fillRect(0, 0, W, H);

  // 테두리 프레임
  ctx.strokeStyle = '#B97A2E';
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = '#E8B23A';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 60, W - 120, H - 120);

  const center = W / 2;

  // 상단 아이콘
  ctx.textAlign = 'center';
  ctx.font = '120px serif';
  ctx.fillText('🗺️', center, 230);

  // 제목
  ctx.fillStyle = '#4A2E0C';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(d.titleLabel, center, 340);

  // 구분선
  ctx.strokeStyle = '#E9D6AE';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(160, 390);
  ctx.lineTo(W - 160, 390);
  ctx.stroke();

  // 행 렌더 헬퍼
  const rows: [string, string][] = [
    [d.explorerLabel, d.explorerName],
    [d.foundAtLabel, d.foundAt],
    [d.stepsLabel, `${d.steps.toLocaleString()}`],
    [d.amountLabel, d.amount],
  ];
  let y = 520;
  rows.forEach(([label, value]) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6B6A64';
    ctx.font = '36px sans-serif';
    ctx.fillText(label, 180, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2C2C2A';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText(value, W - 180, y);
    y += 130;
  });

  // 큰 보물 아이콘
  ctx.textAlign = 'center';
  ctx.font = '180px serif';
  ctx.fillText('🎁', center, y + 120);

  // 발견 ID (하단)
  ctx.fillStyle = '#6B6A64';
  ctx.font = '32px monospace';
  ctx.fillText(`${d.idLabel}: ${d.discoveryId}`, center, H - 110);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/png',
    );
  });
}

/** 공유 시트 호출 (KAKAO_SHARE). 미지원 시 다운로드 폴백. */
export async function shareCertificate(
  blob: Blob,
  text: string,
  fileName = 'treasure-certificate.png',
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], text });
    return 'shared';
  }
  // 폴백: 다운로드
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
