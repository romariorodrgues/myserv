/**
 * Root layout for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Main layout component with global styles and providers
 */

import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header-modern";
import { FooterModern } from "@/components/layout/footer-modern";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "sonner";
import { ClientLayoutWrapper } from "@/components/layout/client-layout-wrapper";
import { SupportChatWidgetWrapper } from "@/components/chat/SupportChatWidgetWrapper";
import ReactQueryProvider from "@/lib/react-query";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyServ - Conectando você aos melhores profissionais",
  description: "Encontre os melhores prestadores de serviços da sua região. Agendamento online, pagamento seguro e profissionais qualificados.",
  keywords: ["serviços", "profissionais", "agendamento", "prestadores", "home services"],
  authors: [{ name: "Romário Rodrigues" }],
  creator: "Romário Rodrigues",
  publisher: "MyServ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://myserv.com.br"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MyServ - Conectando você aos melhores profissionais",
    description: "Encontre os melhores prestadores de serviços da sua região. Agendamento online, pagamento seguro e profissionais qualificados.",
    url: "https://myserv.com.br",
    siteName: "MyServ",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyServ - Conectando você aos melhores profissionais",
    description: "Encontre os melhores prestadores de serviços da sua região.",
    creator: "@myserv",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${manrope.variable}`}> 
      <head>
        <link rel="icon" href="/brand/icone.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <ReactQueryProvider>

         <ClientLayoutWrapper>
        <div className="relative min-h-screen flex flex-col">
          {/* Efeito visual de background animado */}
          <div className="pointer-events-none fixed inset-0 z-0 opacity-60 blur-2xl select-none" aria-hidden="true">
            <div className="absolute left-1/2 top-0 w-[80vw] h-[40vw] -translate-x-1/2 bg-gradient-to-tr from-brand-cyan/30 via-brand-teal/20 to-brand-navy/10 rounded-full filter blur-3xl animate-pulse-slow" />
          </div>
          <AuthProvider>
            <Header />
            <main className="flex-1 z-10 relative">
              {/* Transição de página suave */}
              <div className="transition-all duration-500 ease-in-out animate-fade-in">
                {children}
              </div>
            </main>
            <FooterModern />
            <MobileNavigation />
            
            {/* Widget de Chat de Suporte Global */}
            <SupportChatWidgetWrapper />
            
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  color: '#1a202c',
                },
              }}
            />
          </AuthProvider>
        </div>
         </ClientLayoutWrapper>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
