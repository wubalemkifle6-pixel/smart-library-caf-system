import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastContainer } from "@/components/ui";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <ToastContainer />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
