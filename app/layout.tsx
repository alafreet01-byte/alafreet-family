import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "./components/PWARegister";
export const metadata: Metadata = {
  title:{default:"Alafreet Family",template:"%s | Alafreet Family"},
  description:"النظام العائلي الذكي لعائلة خليفة",
  applicationName:"Alafreet Family",
  manifest:"/manifest.webmanifest",
  appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Alafreet Family"},
  icons:{icon:[{url:"/icons/icon-192.png",sizes:"192x192",type:"image/png"},{url:"/icons/icon-512.png",sizes:"512x512",type:"image/png"}],apple:[{url:"/icons/apple-touch-icon.png",sizes:"180x180",type:"image/png"}]},
  formatDetection:{telephone:false}
};
export const viewport: Viewport = {width:"device-width",initialScale:1,maximumScale:1,userScalable:false,viewportFit:"cover",themeColor:"#030712"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body><PWARegister/>{children}</body></html>}
