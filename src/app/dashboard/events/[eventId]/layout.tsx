// Event layout just passes children through - sidebar is handled by parent dashboard layout
export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
