import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // We can require an authorization header or admin check if needed, 
        // but for now, we'll keep it simple for the designated admin route call.

        // Revalidate the entire site (all paths)
        revalidatePath('/', 'layout');
        // specifically the directory page
        revalidatePath('/directory', 'page');

        return NextResponse.json({
            success: true,
            message: 'Server cache successfully cleared.'
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to clear cache'
        }, { status: 500 });
    }
}
