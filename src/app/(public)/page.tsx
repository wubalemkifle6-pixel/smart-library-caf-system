"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Coffee, Search, Star, Clock, MapPin, Mail,
  Phone, ChevronRight, Library, Heart, Award, Users, BookMarked, ArrowRight,
} from "lucide-react";
import { Button, Card, CardBody, StatCard } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

interface Book {
  id: number;
  title: string;
  author: string;
  coverImage: string | null;
  categoryName: string | null;
  availableQuantity: number;
  price: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);

  useEffect(() => {
    fetch("/api/books?pageSize=4")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setFeaturedBooks(res.data.items);
      });
    fetch("/api/books?pageSize=8&page=2")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPopularBooks(res.data.items);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/books?search=${encodeURIComponent(searchQuery)}`);
  };

  const services = [
    { icon: BookOpen, title: "Book Borrowing", desc: "Borrow up to 5 books at a time for up to 2 weeks", color: "bg-navy-100 text-navy-700" },
    { icon: Coffee, title: "Cozy Café", desc: "Premium coffee, teas, fresh pastries, and light bites", color: "bg-amber-100 text-amber-700" },
    { icon: Library, title: "Reading Spaces", desc: "Quiet reading rooms with comfortable seating and Wi-Fi", color: "bg-emerald-100 text-emerald-700" },
    { icon: BookMarked, title: "Book Purchases", desc: "Buy your favorite titles at competitive prices", color: "bg-purple-100 text-purple-700" },
    { icon: Users, title: "Study Groups", desc: "Reserve group study rooms for collaborative work", color: "bg-sky-100 text-sky-700" },
    { icon: Heart, title: "Community Events", desc: "Author readings, book clubs, and workshops", color: "bg-rose-100 text-rose-700" },
  ];

  const testimonials = [
    { name: "Emily R.", role: "Avid Reader", text: "The best library I've ever been to. The café makes it the perfect spot to spend an entire afternoon with a book." },
    { name: "Michael T.", role: "Student", text: "Great selection, fast Wi-Fi, amazing coffee. It's become my go-to study spot. The staff is incredibly helpful." },
    { name: "Sarah K.", role: "Book Club Member", text: "Love the atmosphere and the community events. They host wonderful author readings and book clubs monthly." },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white hero-pattern">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute right-0 top-0 w-96 h-96 bg-navy-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute left-0 bottom-0 w-96 h-96 bg-sky-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm mb-6">
              <Star size={14} className="text-amber-400" />
              <span>Welcome to your neighborhood literary hub</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-['Playfair_Display'] leading-tight">
              Smart Library<br />
              <span className="text-sky-300">& Book Café</span>
            </h1>
            <p className="mt-6 text-lg text-slate-200 max-w-xl leading-relaxed">
              Where stories meet brew. Borrow, read, study, and savor exceptional coffee
              in a thoughtfully designed space for book lovers, students, and thinkers.
            </p>
            <form onSubmit={handleSearch} className="mt-8 flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books by title, author, or ISBN..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-navy-400/30 text-base"
                />
              </div>
              <Button size="lg" type="submit" className="bg-amber-500 hover:bg-amber-600 text-navy-900 font-semibold">
                Search
              </Button>
            </form>
            <div className="mt-8 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <BookOpen size={18} className="text-sky-300" /> 10,000+ Books
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Coffee size={18} className="text-amber-300" /> Artisan Café
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock size={18} className="text-emerald-300" /> Open Daily
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-navy-700">10K+</div>
            <div className="text-sm text-slate-500 mt-1">Books in Collection</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-navy-700">2,500+</div>
            <div className="text-sm text-slate-500 mt-1">Active Members</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-navy-700">50K+</div>
            <div className="text-sm text-slate-500 mt-1">Books Borrowed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-navy-700">4.9★</div>
            <div className="text-sm text-slate-500 mt-1">Member Rating</div>
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold font-['Playfair_Display'] text-navy-900">Featured Books</h2>
            <p className="mt-2 text-slate-600">Handpicked titles from our current collection</p>
          </div>
          <Link href="/books" className="hidden sm:flex items-center gap-1 text-navy-700 font-medium hover:gap-2 transition-all text-sm">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredBooks.map((book) => (
            <Link href={`/books/${book.id}`} key={book.id}>
              <Card className="overflow-hidden card-hover h-full">
                <div className="aspect-[2/3] bg-gradient-to-br from-navy-600 to-navy-900 relative overflow-hidden">
                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 text-center">
                      <BookOpen size={48} className="text-white/30" />
                    </div>
                  )}
                  {book.availableQuantity > 0 ? (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Available
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Out of stock
                    </div>
                  )}
                </div>
                <CardBody>
                  <p className="text-xs text-navy-600 font-medium uppercase tracking-wider">{book.categoryName || "General"}</p>
                  <h3 className="mt-1 font-semibold text-slate-900 line-clamp-2 leading-tight">{book.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{book.author}</p>
                  {book.price && (
                    <p className="mt-2 font-semibold text-navy-700">{formatCurrency(book.price)}</p>
                  )}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold font-['Playfair_Display'] text-navy-900">Our Services</h2>
            <p className="mt-2 text-slate-600">Everything you need for a perfect reading experience</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.title} className="card-hover">
                  <CardBody className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{s.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{s.desc}</p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Books */}
      {popularBooks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-['Playfair_Display'] text-navy-900">Popular This Month</h2>
              <p className="mt-2 text-slate-600">What our members are reading right now</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularBooks.slice(0, 4).map((book) => (
              <Link href={`/books/${book.id}`} key={book.id}>
                <Card className="overflow-hidden card-hover h-full">
                  <div className="aspect-[2/3] bg-gradient-to-br from-navy-600 to-navy-900 relative">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={40} className="text-white/30" />
                      </div>
                    )}
                  </div>
                  <CardBody>
                    <h3 className="font-semibold text-sm text-slate-900 line-clamp-2">{book.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{book.author}</p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Borrowing Info */}
      <section className="bg-navy-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold font-['Playfair_Display']">How Borrowing Works</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Becoming a member is free. Browse our collection online or in person,
              request books, and enjoy up to two weeks of reading. Return easily at
              the front desk.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { step: "01", title: "Sign Up", desc: "Register for a free membership online" },
                { step: "02", title: "Get Approved", desc: "Wait for quick admin approval" },
                { step: "03", title: "Browse & Borrow", desc: "Request books online or in person" },
                { step: "04", title: "Return", desc: "Return within 14 days. Renew if needed" },
              ].map((i) => (
                <div key={i.step} className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-navy-700 flex items-center justify-center font-bold flex-shrink-0">
                    {i.step}
                  </div>
                  <div>
                    <h4 className="font-semibold">{i.title}</h4>
                    <p className="text-sm text-slate-400">{i.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <Link href="/register">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-navy-900 font-semibold">
                  Become a Member
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800"
              alt="Library interior"
              className="rounded-2xl shadow-2xl w-full"
            />
          </div>
        </div>
      </section>

      {/* Café Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800"
              alt="Café"
              className="rounded-2xl shadow-xl w-full"
            />
          </div>
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium mb-4">
              <Coffee size={14} /> In-House Café
            </div>
            <h2 className="text-3xl font-bold font-['Playfair_Display'] text-navy-900">
              Pair your book with the perfect brew
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Our baristas craft coffee from locally roasted beans. Enjoy
              espresso drinks, loose-leaf teas, fresh pastries, and light bites.
              Order from your seat and we'll bring it to you.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {["Espresso & Coffee", "Loose-Leaf Tea", "Fresh Pastries", "Light Bites", "Cold Brews", "Juices & Water"].map((x) => (
                <div key={x} className="flex items-center gap-2 text-sm text-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {x}
                </div>
              ))}
            </div>
            <Link href="/cafe" className="mt-8 inline-block">
              <Button size="lg" variant="primary">
                View Menu <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-['Playfair_Display'] text-navy-900 text-center mb-12">
            What Our Members Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i}>
                <CardBody>
                  <div className="flex gap-1 text-amber-400 mb-4">
                    {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-slate-700 italic leading-relaxed">"{t.text}"</p>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-gradient-to-r from-navy-700 to-navy-900 text-white overflow-hidden">
          <CardBody className="p-10 lg:p-14 text-center">
            <h2 className="text-3xl font-bold font-['Playfair_Display']">Ready to start reading?</h2>
            <p className="mt-4 text-slate-200 max-w-xl mx-auto">
              Join our community of book lovers today. Membership is free and gives you access to thousands of books,
              our café loyalty program, and community events.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-navy-900 font-semibold">
                  Join the Library
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 border border-white/20">
                  Contact Us
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
