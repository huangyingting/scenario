import type { Metadata } from 'next';
import './globals.css';
import { SessionProviderWrapper } from '@/components/providers/SessionProviderWrapper';

export const metadata: Metadata = {
  title: 'Scenario — AI Game Asset & Creative Production Platform',
  description:
    'Train custom AI models, generate style-consistent 2D, Video, 3D, Audio, PBR Textures & 360° Skyboxes, and automate pipelines with Visual Node Workflows.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0b0c] text-[#f4f4f5] antialiased selection:bg-[#0099ff]/30 selection:text-white">
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
