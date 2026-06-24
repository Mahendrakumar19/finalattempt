'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Video, Send, Mail, MapPin, PhoneCall } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const isPortal = pathname.startsWith('/student') || pathname.startsWith('/faculty') || pathname.startsWith('/admin');

  if (isPortal) return null;

  return (
    <footer className="bg-[#0F172A] text-slate-400 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg border border-blue-500 shadow-md">
                FA
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-lg tracking-tight text-white">
                  FINAL ATTEMPT <span className="text-blue-500">IAS</span>
                </span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase -mt-1">
                  One Mentor. One Strategy.
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 pr-4">
              Empowering Bihar's aspirants with the right guidance, strategy and mentorship. We believe in high-impact personalized preparation, ensuring every student has the tools and direction to crack civil service examinations.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-blue-600 hover:text-white flex items-center justify-center text-slate-400 transition-all">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-pink-600 hover:text-white flex items-center justify-center text-slate-400 transition-all">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-red-600 hover:text-white flex items-center justify-center text-slate-400 transition-all">
                <Video className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-blue-500 hover:text-white flex items-center justify-center text-slate-400 transition-all">
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-white font-bold text-sm uppercase tracking-wider mb-6">Quick Links</h4>
            <ul className="space-y-3.5 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/courses" className="hover:text-white transition-colors">Courses</Link></li>
              <li><Link href="/current-affairs" className="hover:text-white transition-colors">Current Affairs</Link></li>
              <li><Link href="/results" className="hover:text-white transition-colors">Results</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Courses */}
          <div>
            <h4 className="font-heading text-white font-bold text-sm uppercase tracking-wider mb-6">Programs</h4>
            <ul className="space-y-3.5 text-sm">
              <li><Link href="/courses/bpsc-foundation" className="hover:text-white transition-colors">BPSC Foundation Batch</Link></li>
              <li><Link href="/courses/bpsc-target" className="hover:text-white transition-colors">BPSC Target Batch</Link></li>
              <li><Link href="/courses/prelims-test-series" className="hover:text-white transition-colors">Prelims Test Series</Link></li>
              <li><Link href="/courses/mains-answer-writing" className="hover:text-white transition-colors">Mains Answer Writing</Link></li>
              <li><Link href="/courses/interview-guidance" className="hover:text-white transition-colors">Interview Program</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-heading text-white font-bold text-sm uppercase tracking-wider mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <PhoneCall className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <a href="tel:+919113131819" className="hover:text-white transition-colors font-semibold text-white">
                  +91 91131 31819
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <a href="mailto:info@finalattemptias.com" className="hover:text-white transition-colors">
                  info@finalattemptias.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <span>
                  Boring Road, Patna,<br />
                  Bihar - 860001
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Copyright */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} Final Attempt IAS. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link href="/admin" className="hover:text-white transition-colors font-medium text-slate-500">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
