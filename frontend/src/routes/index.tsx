import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeRouteComponent,
});

function HomeRouteComponent() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Home</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Welcome to tkhq-ff — the Turnkey feature flag admin dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard
          title="Feature Flags"
          description="Manage global rollout, per-org and per-product overrides for all feature flags."
          href="/flags"
        />
        <PlaceholderCard
          title="Org Search"
          description="Look up an organization by UUID to see which flags have overrides applied."
          href="/orgs"
        />
        <PlaceholderCard
          title="Environments"
          description="Switch between local, dev, preprod, and production environments using the selector in the header."
        />
      </div>

      <div className="rounded-lg border border-border bg-card-background p-6 space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Quick Links
        </h2>
        <ul className="space-y-2 text-sm text-foreground">
          <li>
            <a href="/flags" className="text-primary hover:underline">
              Browse all feature flags →
            </a>
          </li>
          <li>
            <a href="/orgs" className="text-primary hover:underline">
              Search by org →
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

function PlaceholderCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-lg border border-border bg-card-background p-5 space-y-2 h-full">
      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block no-underline hover:opacity-80 transition-opacity"
      >
        {inner}
      </a>
    );
  }

  return inner;
}
