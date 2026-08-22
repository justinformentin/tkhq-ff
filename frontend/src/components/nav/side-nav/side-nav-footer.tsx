import * as LucideIcons from 'lucide-react';
import type { TSideNavFooterItem } from './types';

function FooterIcon({ name, size = 18 }: { name: string; size?: number }) {
  const icons = LucideIcons as unknown as Record<
    string,
    React.ComponentType<{ size?: number }>
  >;
  const Icon = icons[name];
  if (!Icon) return null;
  return <Icon size={size} />;
}

function footerItemClassName(isExpanded: boolean) {
  return [
    'flex items-center rounded-lg text-sm text-gray-500 hover:bg-white/8 hover:text-gray-200 transition-colors',
    isExpanded ? 'gap-2 px-2 py-1.5' : 'h-9 w-9 justify-center p-0',
  ].join(' ');
}

function FooterItemContent({
  isExpanded,
  label,
  iconName,
}: {
  isExpanded: boolean;
  label: string;
  iconName: string;
}) {
  return isExpanded ? (
    <span className="flex items-center gap-2 min-w-0 truncate whitespace-nowrap">
      <FooterIcon name={iconName} size={16} />
      {label}
    </span>
  ) : (
    <>
      <span className="flex size-5 shrink-0 items-center justify-center">
        <FooterIcon name={iconName} size={18} />
      </span>
      <span className="sr-only">{label}</span>
    </>
  );
}

type SideNavFooterProps = {
  items: TSideNavFooterItem[];
  isExpanded: boolean;
};

export function SideNavFooter({ items, isExpanded }: SideNavFooterProps) {
  return (
    <div className="flex flex-col">
      <div className="mb-2 h-px bg-white/8" />
      <div
        className={[
          'flex',
          isExpanded
            ? 'flex-row items-center gap-2 px-2 py-1'
            : 'flex-col items-center gap-1',
        ].join(' ')}
      >
        {items.map((item) => {
          const content = (
            <FooterItemContent
              isExpanded={isExpanded}
              label={item.label}
              iconName={item.iconName}
            />
          );
          const title = !isExpanded ? item.label : undefined;

          return item.kind === 'link' ? (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={footerItemClassName(isExpanded)}
              title={title}
            >
              {content}
            </a>
          ) : (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={footerItemClassName(isExpanded)}
              title={title}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
