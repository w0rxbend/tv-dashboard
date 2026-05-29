import { Show, mergeProps } from 'solid-js';
import { MS } from './MS';
import { cardErrorMessage } from './cardErrorMessage';

/**
 * Larger empty/error state for card body regions.
 *
 * @param {{ error: unknown, icon?: string, title?: string }} props
 */
export function ErrorState(props) {
  const merged = mergeProps({ icon: 'warning', title: 'Unable to load' }, props);
  const message = () => cardErrorMessage(merged.error);

  return (
    <Show when={message()}>
      {(text) => (
        <div
          role="alert"
          style={{
            height: '100%',
            'min-height': '156px',
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'justify-content': 'center',
            gap: '10px',
            padding: '20px',
            'text-align': 'center',
            background: 'var(--md-surface-container-low)',
            'border-radius': 'var(--shape-md)',
            color: 'var(--md-on-surface)',
          }}
        >
          <MS
            name={merged.icon}
            size={64}
            fill
            style={{ color: 'var(--md-bad)', opacity: 0.95 }}
          />
          <div class="t-title-md" style={{ color: 'var(--md-on-surface)' }}>
            {merged.title}
          </div>
          <div class="t-body-sm muted" style={{ 'max-width': '260px' }}>
            {text()}
          </div>
        </div>
      )}
    </Show>
  );
}
