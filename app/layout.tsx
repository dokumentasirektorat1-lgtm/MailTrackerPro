import type { Metadata } from "next";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { Toaster } from 'sonner';
import "./globals.css";

export const metadata: Metadata = {
    title: "MailTrack Pro - Mail Management System",
    description: "Comprehensive mail tracking and management system with MS Access synchronization",
    keywords: "mail tracking, document management, MS Access, Firebase, mail system",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased">
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var stored = localStorage.getItem('theme');
                                    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                                        document.documentElement.classList.add('dark');
                                    } else {
                                        document.documentElement.classList.remove('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
                <AuthProvider>
                    {children}
                    <Toaster richColors position="top-right" closeButton />
                </AuthProvider>
            </body>
        </html>
    );
}
