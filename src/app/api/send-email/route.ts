import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { address, totalScore, verdict, surveyorName } = await request.json();

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 'your_resend_api_key') {
      return NextResponse.json({ message: 'Email not configured' }, { status: 200 });
    }

    const verdictLabels: Record<string, string> = {
      feasible: 'KHA THI',
      potential: 'CO TIEM NANG',
      risky: 'NHIEU RUI RO',
    };

    const verdictColors: Record<string, string> = {
      feasible: '#22C55E',
      potential: '#EAB308',
      risky: '#EF4444',
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Phúc Tea Khảo Sát <onboarding@resend.dev>',
        to: 'ceo@phuctea.com.vn',
        subject: `[Khảo sát MB] ${address} - ${totalScore} điểm - ${verdictLabels[verdict] || verdict}`,
        html: `
          <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #1C1C1C; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #FFC033; margin: 0; font-size: 24px;">Phúc Tea</h1>
              <p style="color: #888; margin: 4px 0 0; font-size: 14px;">Thông báo khảo sát mặt bằng mới</p>
            </div>
            <div style="background: #fff; padding: 24px; border: 1px solid #eee; border-top: none;">
              <h2 style="margin: 0 0 16px; font-size: 18px; color: #1C1C1C;">Kết quả đánh giá</h2>

              <div style="text-align: center; margin: 20px 0;">
                <div style="display: inline-block; width: 80px; height: 80px; border-radius: 50%; background: ${verdictColors[verdict]}; line-height: 80px; text-align: center;">
                  <span style="color: white; font-size: 28px; font-weight: bold;">${totalScore}</span>
                </div>
                <p style="margin: 8px 0 0;">
                  <span style="background: ${verdictColors[verdict]}; color: white; padding: 4px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                    ${verdictLabels[verdict] || verdict}
                  </span>
                </p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Dia chi:</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${address}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Nguoi khao sat:</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${surveyorName}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">Tong diem:</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${totalScore}/100</td></tr>
              </table>

              <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px;">
                Vui long dang nhap Dashboard de xem chi tiet.
              </p>
            </div>
            <div style="background: #f5f5f5; padding: 12px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #888; font-size: 11px;">© ${new Date().getFullYear()} Phuc Tea. All rights reserved.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error('Resend error:', errData);
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent' });
  } catch (err) {
    console.error('Email error:', err);
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
  }
}
