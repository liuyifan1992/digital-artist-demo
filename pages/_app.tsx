import '@/styles/base.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
    <main className='w-full max-w-3xl mx-auto py-16 flex flex-col gap-3'>
        <Component {...pageProps} />
    </main>
    </>
  );
}

export default MyApp;
