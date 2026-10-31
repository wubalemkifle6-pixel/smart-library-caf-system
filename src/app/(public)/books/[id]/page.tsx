"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, User, Calendar, Hash, Building2, MapPin, ShoppingCart, BookMarked, ArrowLeft } from "lucide-react";
import { Card, CardBody, Button, Badge, LoadingSpinner, showToast } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/Providers";

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  categoryName: string | null;
  categoryId: number | null;
  publicationYear: number | null;
  publisher: string | null;
  description: string | null;
  coverImage: string | null;
  totalQuantity: number;
  availableQuantity: number;
  shelfLocation: string | null;
  price: string | null;
  isForBorrow: boolean;
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/books/${params.id}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setBook(res.data);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleBorrowRequest = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/borrowings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book?.id }),
      }).then(r => r.json());
      if (res.success) {
        showToast("Borrow request submitted successfully!", "success");
      } else {
        showToast(res.error || "Failed to request book", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book?.id }),
      }).then(r => r.json());
      if (res.success) {
        showToast("Book reserved successfully!", "success");
      } else {
        showToast(res.error || "Failed to reserve book", "error");
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="py-20"><LoadingSpinner label="Loading book..." /></div>;
  if (!book) return <div className="max-w-4xl mx-auto py-20 text-center"><p>Book not found.</p><Link href="/books" className="text-navy-700 hover:underline mt-4 inline-block">Back to books</Link></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/books" className="inline-flex items-center gap-2 text-sm text-navy-700 hover:underline mb-6">
        <ArrowLeft size={16} /> Back to catalog
      </Link>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-navy-600 to-navy-900 overflow-hidden shadow-2xl">
            {book.coverImage ? (
              <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen size={80} className="text-white/20" />
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          {book.categoryName && (
            <div className="mb-3"><Badge variant="info">{book.categoryName}</Badge></div>
          )}
          <h1 className="text-3xl lg:text-4xl font-bold font-['Playfair_Display'] text-navy-900">{book.title}</h1>
          <p className="mt-2 text-lg text-slate-600 flex items-center gap-2">
            <User size={18} /> {book.author}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {book.isbn && (
              <div className="flex items-center gap-2 text-slate-600">
                <Hash size={16} className="text-slate-400" /> ISBN: {book.isbn}
              </div>
            )}
            {book.publicationYear && (
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={16} className="text-slate-400" /> Published: {book.publicationYear}
              </div>
            )}
            {book.publisher && (
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 size={16} className="text-slate-400" /> {book.publisher}
              </div>
            )}
            {book.shelfLocation && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={16} className="text-slate-400" /> Shelf: {book.shelfLocation}
              </div>
            )}
          </div>

          <Card className="mt-6">
            <CardBody>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-slate-500">Availability</p>
                  <div className="mt-1">
                    {book.availableQuantity > 0 ? (
                      <Badge variant="success">{book.availableQuantity} of {book.totalQuantity} available</Badge>
                    ) : (
                      <Badge variant="danger">Currently unavailable</Badge>
                    )}
                  </div>
                </div>
                {book.price && (
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Purchase Price</p>
                    <p className="text-2xl font-bold text-navy-700">{formatCurrency(book.price)}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {book.description && (
            <div className="mt-8">
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-700 leading-relaxed">{book.description}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {book.availableQuantity > 0 ? (
              <Button size="lg" onClick={handleBorrowRequest} loading={actionLoading}>
                <BookMarked size={18} /> Request to Borrow
              </Button>
            ) : (
              <Button size="lg" variant="secondary" onClick={handleReserve} loading={actionLoading}>
                <BookMarked size={18} /> Reserve Book
              </Button>
            )}
            {book.price && (
              <Button size="lg" variant="outline">
                <ShoppingCart size={18} /> Purchase
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
