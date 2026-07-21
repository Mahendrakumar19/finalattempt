// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { Mail, MapPin, PhoneCall, Globe, Video, Send, Eye } from 'lucide-react';
// import {
//   FaFacebookF,
//   FaInstagram,
//   FaYoutube,
//   FaTelegramPlane,
// } from "react-icons/fa";

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// export default function Footer() {
//   const pathname = usePathname();
//   const [visitorsCount, setVisitorsCount] = useState<number | null>(null);

//   const isPortal = pathname.startsWith('/student') || pathname.startsWith('/faculty') || pathname.startsWith('/admin') || pathname.startsWith('/lms');

//   useEffect(() => {
//     if (isPortal) return;

//     const incrementVisitors = async () => {
//       try {
//         const res = await fetch(`${BACKEND_URL}/api/visitors/increment`, { method: 'POST' });
//         if (res.ok) {
//           const data = await res.json();
//           if (data.success) {
//             setVisitorsCount(data.visitorsCount);
//           }
//         }
//       } catch (err) {
//         console.warn('Failed to increment visitor counter:', err);
//       }
//     };
//     incrementVisitors();
//   }, [isPortal]);

//   if (isPortal) return null;

//   return (
//     <footer className="bg-[#090D1A] text-slate-400 pt-16 pb-8 border-t border-slate-900 font-body relative overflow-hidden">
//       {/* Subtle bottom flare */}
//       <div className="absolute bottom-0 right-1/4 w-96 h-48 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

//       <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
//           {/* Logo & Description */}
//           <div className="lg:col-span-2 space-y-6">
//             <Link href="/" className="flex items-center">
//               <div className="relative w-48 h-12 shrink-0">
//                 <img
//                   src="/lightlogofull.png"
//                   alt="Final Attempt"
//                   className="w-full h-full object-contain"
//                 />
//               </div>
//             </Link>
//             <p className="text-xs leading-relaxed text-slate-400 pr-4">
//               Empowering Bihar's civil services aspirants with structured daily mentorship, analytics diagnostics, and topper strategy mapping. We deliver outcome-oriented preparation for your successful attempt.
//             </p>
//             {/* Social Media Links */}
//             <div className="flex items-center gap-4">
//               <a
//                 href="https://www.facebook.com/finalattemptofficial"
//                 target="_blank"
//                 rel="noreferrer"
//                 aria-label="Facebook"
//                 className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-[#1877F2] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-[#1877F2] hover:text-white hover:shadow-[0_10px_30px_rgba(24,119,242,.45)]"
//               >
//                 <FaFacebookF className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
//               </a>
//               <a
//                 href="https://www.instagram.com/finalattempt_official"
//                 target="_blank"
//                 rel="noreferrer"
//                 aria-label="Instagram"
//                 className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-pink-500/20 bg-pink-500/10 text-[#E1306C] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-gradient-to-br hover:from-[#FEDA75] hover:via-[#E1306C] hover:to-[#833AB4] hover:text-white hover:shadow-[0_10px_30px_rgba(225,48,108,.45)]"
//               >
//                 <FaInstagram className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
//               </a>
//               <a
//                 href="https://www.youtube.com/@FinalAttemptOfficial"
//                 target="_blank"
//                 rel="noreferrer"
//                 aria-label="YouTube"
//                 className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-[#FF0000] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-[#FF0000] hover:text-white hover:shadow-[0_10px_30px_rgba(255,0,0,.45)]"
//               >
//                 <FaYoutube className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
//               </a>
//               <a
//                 href="https://t.me/Finalattemptofficial"
//                 target="_blank"
//                 rel="noreferrer"
//                 aria-label="Telegram"
//                 className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-[#229ED9] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-[#229ED9] hover:text-white hover:shadow-[0_10px_30px_rgba(34,158,217,.45)]"
//               >
//                 <FaTelegramPlane className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />
//               </a>
//             </div>
//           </div>

//           {/* Quick Links */}
//           <div>
//             <h4 className="font-heading text-white font-bold text-xs uppercase tracking-wider mb-6 border-l-2 border-amber-500 pl-3">
//               Quick Links
//             </h4>
//             <ul className="space-y-3.5 text-xs">
//               <li><Link href="/" className="hover:text-amber-400 transition-colors">Home</Link></li>
//               <li><Link href="/about" className="hover:text-amber-400 transition-colors">About & Contact</Link></li>
//               <li><Link href="/courses" className="hover:text-amber-400 transition-colors">Courses</Link></li>
//               <li><Link href="/test-series" className="hover:text-amber-400 transition-colors">Test Series</Link></li>
//               <li><Link href="/current-affairs" className="hover:text-amber-400 transition-colors">Current Affairs</Link></li>
//               <li><Link href="/pyq" className="hover:text-amber-400 transition-colors">PYQ Papers</Link></li>
//               <li><Link href="/blog" className="hover:text-amber-400 transition-colors">Blogs & News</Link></li>
//             </ul>
//           </div>

//           {/* Programs */}
//           <div>
//             <h4 className="font-heading text-white font-bold text-xs uppercase tracking-wider mb-6 border-l-2 border-amber-500 pl-3">
//               Programs
//             </h4>
//             <ul className="space-y-3.5 text-xs">
//               <li><Link href="/courses" className="hover:text-amber-400 transition-colors">BPSC Foundation Course</Link></li>
//               <li><Link href="/test-series" className="hover:text-amber-400 transition-colors">Prelims Test Series</Link></li>
//               <li><Link href="/courses" className="hover:text-amber-400 transition-colors">Mains Answer Writing</Link></li>
//               <li><Link href="/courses" className="hover:text-amber-400 transition-colors">Interview Guidance</Link></li>
//             </ul>
//           </div>

//           {/* Contact Details */}
//           <div>
//             <h4 className="font-heading text-white font-bold text-xs uppercase tracking-wider mb-6 border-l-2 border-amber-500 pl-3">
//               Contact Us
//             </h4>
//             <ul className="space-y-4 text-xs">
//               <li className="flex items-start gap-3">
//                 <PhoneCall className="w-4 h-4 text-amber-550 mt-0.5 shrink-0" />
//                 <a href="tel:+919709992093" className="hover:text-white transition-colors font-semibold text-slate-300">
//                   +91 97099 92093
//                 </a>
//               </li>
//               <li className="flex items-start gap-3">
//                 <Mail className="w-4 h-4 text-amber-550 mt-0.5 shrink-0" />
//                 <a href="mailto:enquiry@finalattemptias.com" className="hover:text-white transition-colors text-slate-350">
//                   enquiry@finalattemptias.com
//                 </a>
//               </li>
//               <li className="flex items-start gap-3">
//                 <MapPin className="w-4 h-4 text-amber-550 mt-0.5 shrink-0" />
//                 <span className="text-slate-350">
//                   Boring Road Crossing,<br />
//                   Patna, Bihar - 860001
//                 </span>
//               </li>
//             </ul>
//           </div>
//         </div>

//         {/* Legal & Copyright */}
//         <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
//           <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center" suppressHydrationWarning={true}>
//             <p>&copy; {new Date().getFullYear()} Final Attempt. All Rights Reserved.</p>
//             <span className="text-slate-800 hidden sm:inline" suppressHydrationWarning={true}>|</span>
//             <span className="text-slate-400">
//               Designed & Developed by <a href="https://nighwantech.com" target="_blank" rel="noreferrer" className="text-amber-500 hover:underline">Nighwan Technology Pvt. Ltd.</a>
//             </span>
//           </div>

//           {/* Visitors Count Badge */}
//           {visitorsCount !== null && (
//             <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
//               <Eye className="w-3.5 h-3.5 text-amber-500" />
//               <span>Visitors Count: </span>
//               <span className="text-white font-bold tracking-widest">{visitorsCount.toLocaleString()}</span>
//             </div>
//           )}
//         </div>
//       </div>
//     </footer>
//   );
// }


'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mail,
  MapPin,
  PhoneCall,
  Eye,
  TrendingUp,
} from 'lucide-react';

import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTelegramPlane,
} from 'react-icons/fa';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function Footer() {
  const pathname = usePathname();
  const [visitorsCount, setVisitorsCount] = useState<number | null>(null);

  const isPortal =
    pathname.startsWith('/student') ||
    pathname.startsWith('/faculty') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/lms');

  useEffect(() => {
    if (isPortal) return;

    const incrementVisitors = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/visitors/increment`,
          {
            method: 'POST',
          }
        );

        if (!res.ok) return;

        const data = await res.json();

        if (data.success) {
          setVisitorsCount(data.visitorsCount);
        }
      } catch (_) {}
    };

    incrementVisitors();
  }, [isPortal]);

  if (isPortal) return null;

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#070B16] pt-20 pb-8 text-slate-300">

      {/* Background Glow */}
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-yellow-400/5 blur-[140px]" />
      <div className="absolute left-1/2 top-0 h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      <div className="relative z-10 mx-auto max-w-screen-2xl px-6 lg:px-10">
        <div className="grid gap-8 xl:gap-10 lg:grid-cols-12">

          {/* Brand */}
          <div className="space-y-8 lg:col-span-4">

            <Link
              href="/"
              className="inline-flex items-center"
            >
              <img
                src="/lightlogofull.png"
                alt="Final Attempt"
                className="h-16 w-auto object-contain"
              />
            </Link>

            <p className="max-w-lg text-sm leading-7 text-slate-400">
              Final Attempt is Bihar's premium preparation platform for
              BPSC aspirants, combining structured courses, mentorship,
              analytics, current affairs and test series to maximize
              every student's chance of selection.
            </p>

            {/* Social Icons */}
            <div className="flex flex-wrap gap-4">

              <a
                href="https://www.facebook.com/finalattemptofficial"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-[#1877F2] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-[#1877F2] hover:text-white hover:shadow-[0_12px_35px_rgba(24,119,242,.45)]"
              >
                <FaFacebookF size={18} />
              </a>

              <a
                href="https://www.instagram.com/finalattempt_official"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-pink-500/20 bg-pink-500/10 text-[#E1306C] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-gradient-to-br hover:from-[#FEDA75] hover:via-[#E1306C] hover:to-[#833AB4] hover:text-white hover:shadow-[0_12px_35px_rgba(225,48,108,.45)]"
              >
                <FaInstagram size={18} />
              </a>

              <a
                href="https://www.youtube.com/@FinalAttemptOfficial"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-[#FF0000] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-[#FF0000] hover:text-white hover:shadow-[0_12px_35px_rgba(255,0,0,.45)]"
              >
                <FaYoutube size={20} />
              </a>

              <a
                href="https://t.me/Finalattemptofficial"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-[#229ED9] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-[#229ED9] hover:text-white hover:shadow-[0_12px_35px_rgba(34,158,217,.45)]"
              >
                <FaTelegramPlane size={18} />
              </a>

            </div>   {/* Social Icons */}

          </div>   {/* Brand Section */}

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-white">
              Quick Links
            </h3>

            <ul className="space-y-4 text-sm">
              {[
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about" },
                { label: "Courses", href: "/courses" },
                { label: "Test Series", href: "/test-series" },
                { label: "Current Affairs", href: "/current-affairs" },
                { label: "PYQ Papers", href: "/pyq" },
                { label: "Blogs", href: "/blog" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center text-slate-400 transition-all duration-300 hover:text-amber-400"
                  >
                    <span className="mr-2 h-[2px] w-0 rounded-full bg-amber-400 transition-all duration-300 group-hover:w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div className="lg:col-span-2">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-white">
              Programs
            </h3>

            <ul className="space-y-4 text-sm">
              {[
                "BPSC Foundation Course",
                "Prelims Test Series",
                "Mains Answer Writing",
                "Interview Guidance",
              ].map((program) => (
                <li key={program}>
                  <Link
                    href="/courses"
                    className="group inline-flex items-center text-slate-400 transition-all duration-300 hover:text-amber-400"
                  >
                    <span className="mr-2 h-[2px] w-0 rounded-full bg-amber-400 transition-all duration-300 group-hover:w-4" />
                    {program}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Card */}
          <div className="lg:col-span-4">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-white">
              Contact Us
            </h3>

            <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04]
border-white/5
shadow-[0_10px_60px_rgba(0,0,0,.35)] p-6 backdrop-blur-xl">

              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <PhoneCall size={18} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    Phone
                  </p>

                  <a
                    href="tel:+919709992093"
                    className="mt-1 block font-semibold text-white transition hover:text-amber-400"
                  >
                    +91 97099 92093
                  </a>
                </div>
              </div>

              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <Mail size={18} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    Email
                  </p>

                  <a
                    href="mailto:enquiry@finalattemptias.com"
                    className="mt-1 block text-sm leading-6 text-white transition hover:text-amber-400"
                  >
                    enquiry@finalattemptias.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <MapPin size={18} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    Office
                  </p>

                  <p className="mt-1 leading-6 text-slate-300">
                    Boring Road Crossing
                    <br />
                    Patna, Bihar – 800001
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
        {/* Bottom Bar */}
        <div className="relative mt-16 border-t border-white/10 pt-8">

          {/* Top Border Glow */}
          <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            {/* Left Side */}
            <div className="space-y-2 text-center lg:text-left">

              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()}
                <span className="font-semibold text-white">
                  {" "}Final Attempt
                </span>
                . All Rights Reserved.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 lg:justify-start">

                <Link
                  href="/privacy-policy"
                  className="transition hover:text-amber-400"
                >
                  Privacy Policy
                </Link>

                <span>•</span>

                <Link
                  href="/terms"
                  className="transition hover:text-amber-400"
                >
                  Terms & Conditions
                </Link>

                <span>•</span>

                <Link
                  href="/refund-policy"
                  className="transition hover:text-amber-400"
                >
                  Refund Policy
                </Link>

                <span>•</span>

                <Link
                  href="/disclaimer"
                  className="transition hover:text-amber-400"
                >
                  Disclaimer
                </Link>

              </div>

            </div>

            {/* Right Side */}
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-end">

              {/* Professional Visitor Counter */}
              {visitorsCount !== null && (
                <div className="group inline-flex items-center gap-3.5 rounded-2xl border border-amber-500/20 bg-slate-900/80 px-4.5 py-2.5 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-amber-500/40 hover:bg-slate-900">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    <TrendingUp size={16} className="text-amber-400 transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Visitors Count
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-1 font-mono">
                      {visitorsCount.toLocaleString('en-IN').split('').map((digit, idx) => (
                        <span
                          key={idx}
                          className={digit === ',' ? 'text-slate-500 font-bold px-0.5' : 'bg-white/10 border border-white/15 px-1.5 py-0.5 rounded text-white text-xs font-black shadow-inner'}
                        >
                          {digit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Developer Credit */}
              <a
                href="https://nighwantech.com"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-400 transition-all duration-300 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300"
              >

                <span className="h-2 w-2 rounded-full bg-amber-400 transition group-hover:animate-pulse" />

                Designed & Developed by

                <span className="font-semibold text-white group-hover:text-amber-300">
                  Nighwan Technology Pvt. Ltd.
                </span>

              </a>

            </div>

          </div>

        </div>

      </div>
    </footer>
  );
}
