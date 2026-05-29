import { Show } from 'solid-js';
import { MS } from './MS';
import { cardErrorMessage } from './cardErrorMessage';

/**
 * Inline error banner shown inside a card when its data resource errors.
 * Keeps the card shell visible so the layout doesn't collapse.
 *
 * @param {{ error: unknown }} props
 */
export function CardError(props) {
  const message = () => cardErrorMessage(props.error);

  return (
    <Show when={message()}>
      {(text) => (
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
          {text()}
        </div>
      )}
    </Show>
  );
}
