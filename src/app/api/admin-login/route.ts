import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Read from environment variables, fallback to hardcoded values for backward compatibility
    const adminEmail = process.env.ADMIN_EMAIL || 'ceo@phuctea.com.vn';
    const adminPassword = process.env.ADMIN_PASSWORD || '31032017';

    if (email === adminEmail && password === adminPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Lỗi hệ thống. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
