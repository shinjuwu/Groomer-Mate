import type liff from '@line/liff';

type LiffInstance = typeof liff;

interface ShareParams {
  summary: string;
  petName?: string;
  date?: string;
}

export async function shareGroomingSummary(
  liffInstance: LiffInstance,
  params: ShareParams,
): Promise<boolean> {
  if (!liffInstance.isInClient()) {
    return false;
  }

  const title = params.petName
    ? `${params.petName} 的美容紀錄`
    : '美容紀錄';

  const dateStr = params.date
    ? new Date(params.date).toLocaleDateString('zh-TW')
    : new Date().toLocaleDateString('zh-TW');

  const flexMessage = {
    type: 'flex' as const,
    altText: `${title} - ${dateStr}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🐾 Groomer Mate',
            size: 'sm',
            color: '#2563EB',
            weight: 'bold',
          },
        ],
        paddingBottom: 'none',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: title,
            size: 'lg',
            weight: 'bold',
            wrap: true,
          },
          {
            type: 'text',
            text: dateStr,
            size: 'xs',
            color: '#999999',
          },
          {
            type: 'separator',
          },
          {
            type: 'text',
            text: params.summary,
            size: 'sm',
            wrap: true,
            color: '#333333',
          },
        ],
      },
    },
  };

  try {
    await liffInstance.shareTargetPicker([flexMessage as any]);
    return true;
  } catch (err) {
    console.error('Share failed:', err);
    return false;
  }
}
