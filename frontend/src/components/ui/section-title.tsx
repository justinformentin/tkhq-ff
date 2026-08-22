interface SectionTitleProps {
  children: React.ReactNode;
}

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2 className="font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
      {children}
    </h2>
  );
}
