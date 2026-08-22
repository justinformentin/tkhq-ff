import { ToggleGroup } from '@/components/ui/toggle-group';

/**
 * The Allow/Deny pair that fronts both the org and product override forms.
 * `value` is the allow side, matching the `enabled` field both rules carry.
 */
export function RuleToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (allow: boolean) => void;
}) {
  return (
    <ToggleGroup
      value={value}
      onChange={onChange}
      options={[
        { value: true, label: 'Allow', tone: 'success' },
        { value: false, label: 'Deny', tone: 'danger' },
      ]}
    />
  );
}
