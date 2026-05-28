import { MS } from './MS';

/**
 * Inline error banner shown inside a card when its data resource errors.
 * Keeps the card shell visible so the layout doesn't collapse.
 *
 * @param {{ error: unknown }} props
 */
export function CardError(props) {
  const message = () => {
    const e = props.error;
    if (!e)                      return '';
    if (e?.code === 'cancelled') return '';
    if (e?.code === 'timeout')   return 'Request timed out — retrying';
    return e?.message ?? 'Failed to load';
  };

  if (!message()) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex', 'align-items': 'center', gap: '8px',
        padding: '8px 12px', 'border-radius': 'var(--shape-sm)',
        background: 'var(--md-bad-container)', color: 'var(--md-on-bad-container)',
        'font-size': '13px',
      }}
    >
      <MS name="warning" size={16}/>
      {message()}
    </div>
  );
}
