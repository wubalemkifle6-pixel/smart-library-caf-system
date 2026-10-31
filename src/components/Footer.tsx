import Link from "next/link";
import { BookOpen, Coffee, Mail, Phone, MapPin, Clock, Globe, MessageCircle, Share2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg font-['Playfair_Display']">Smart Library</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Coffee size={10} /> Book Café
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Where stories meet brew. Discover, borrow, and read in our cozy modern library
              with a premium café experience.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Globe size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <MessageCircle size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Share2 size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/books" className="hover:text-white transition-colors">Browse Books</Link></li>
              <li><Link href="/cafe" className="hover:text-white transition-colors">Café Menu</Link></li>
              <li><Link href="/actors" className="hover:text-white transition-colors">Actors</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>Book Borrowing</li>
              <li>Reading Spaces</li>
              <li>Book Purchases</li>
              <li>Café & Refreshments</li>
              <li>Study Rooms</li>
              <li>Community Events</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-navy-400" />
                <span>123 Library Lane<br />Booktown, BK 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="flex-shrink-0 text-navy-400" />
                <span>+1 (555) 123-LIBS</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="flex-shrink-0 text-navy-400" />
                <span>hello@smartlibrary.cafe</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} className="mt-0.5 flex-shrink-0 text-navy-400" />
                <div>
                  Mon-Fri: 7:00 AM - 10:00 PM<br />
                  Sat-Sun: 8:00 AM - 11:00 PM
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Smart Library & Book Café. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Help Center</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
