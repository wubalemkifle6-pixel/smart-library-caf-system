import { ToastContainer } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
