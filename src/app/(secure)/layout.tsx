import { AuthGate } from "@/components/LoginPopup";

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGate>{children}</AuthGate>;
}
