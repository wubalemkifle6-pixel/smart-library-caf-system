import { ToastContainer } from "@/components/ui";
import { PageTransition } from "@/components/motion/AutoReveal";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageTransition>{children}</PageTransition>
      <ToastContainer />
    </>
  );
}
