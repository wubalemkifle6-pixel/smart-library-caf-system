"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BookOpen, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardBody, Button, Input, Select, Badge, EmptyState, LoadingSpinner } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  categoryName: string | null;
  categoryId: number | null;
  publicationYear: number | null;
  coverImage: string | null;
  availableQuantity: number;
  totalQuantity: number;
  price: string | null;
}

interface Category {
  id: number;
  name: string;
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [availability, setAvailability] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  const loadBooks = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      search,
    });
    if (categoryId) params.set("categoryId", categoryId);
    if (availability) params.set("availability", availability);
    fetch(`/api/books?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setBooks(res.data.items);
          setTotalPages(res.data.totalPages);
          setTotal(res.data.total);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/book-categories")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCategories(res.data);
      });
  }, []);

  useEffect(() => {
    loadBooks();
  }, [page, categoryId, availability]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadBooks();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-['Playfair_Display'] text-navy-900">Browse Books</h1>
        <p className="mt-2 text-slate-600">Explore our collection of {total}+ titles</p>
      </div>

      {/* Search + Filters */}
      <Card className="mb-8">
        <CardBody className="p-5">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author, or ISBN..."
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-100 text-sm"
              />
            </div>
            <Select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              options={[{ value: "", label: "All Categories" }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
              className="md:w-56"
            />
            <Select
              value={availability}
              onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
              options={[
                { value: "", label: "All Availability" },
                { value: "available", label: "Available" },
                { value: "unavailable", label: "Unavailable" },
              ]}
              className="md:w-48"
            />
            <Button type="submit">Search</Button>
          </form>
        </CardBody>
      </Card>

      {loading ? (
        <LoadingSpinner label="Loading books..." />
      ) : books.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No books found"
            description="Try adjusting your search or filters to find what you're looking for."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book) => (
              <Link href={`/books/${book.id}`} key={book.id}>
                <Card className="overflow-hidden card-hover h-full">
                  <div className="aspect-[2/3] bg-gradient-to-br from-navy-600 to-navy-900 relative overflow-hidden">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-6">
                        <BookOpen size={48} className="text-white/30" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {book.availableQuantity > 0 ? (
                        <Badge variant="success">Available</Badge>
                      ) : (
                        <Badge variant="danger">Out of Stock</Badge>
                      )}
                    </div>
                  </div>
                  <CardBody>
                    {book.categoryName && (
                      <p className="text-xs text-navy-600 font-medium uppercase tracking-wider">{book.categoryName}</p>
                    )}
                    <h3 className="mt-1 font-semibold text-slate-900 line-clamp-2 leading-tight text-sm">{book.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{book.author}</p>
                    {book.price && (
                      <p className="mt-2 font-semibold text-navy-700">{formatCurrency(book.price)}</p>
                    )}
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={16} /> Prev
              </Button>
              <div className="px-4 text-sm text-slate-600">
                Page {page} of {totalPages}
              </div>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
