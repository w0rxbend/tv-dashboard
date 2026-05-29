import { createMemo, createResource } from 'solid-js';
import { MS } from '../primitives';
import { useNow } from '../data';
import { summarizeStatuses, resourceStatus } from '../data/resourceStatus';
import { fetchLocation } from '../api';
import AppLogo from './AppLogo';

export default function TopBar(props) {
  const now  = useNow(1000);
  const hh   = createMemo(() => String(now().getHours()).padStart(2, '0'));
  const mm   = createMemo(() => String(now().getMinutes()).padStart(2, '0'));
  const ss   = createMemo(() => String(now().getSeconds()).padStart(2, '0'));
  const day  = createMemo(() => now().toLocaleDateString('en-US', { weekday: 'long' }));
  const date = createMemo(() => now().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));

  const [location] = createResource(fetchLocation);
  const feedCounts = createMemo(() => summarizeStatuses([
    resourceStatus(props.airQuality),
    resourceStatus(props.weather),
    resourceStatus(props.events),
    resourceStatus(props.reminders),
  ]));

  const locationLabel = () => {
    const loc = location();
    if (!loc) return '…';
    return `${loc.city} · ${loc.region}`;
  };

  const feedHealthy = () => feedCounts().down === 0 && feedCounts().checking === 0;
  const feedLabel = () => {
    const counts = feedCounts();
    if (counts.down) return `${counts.down} feed${counts.down === 1 ? '' : 's'} unavailable`;
    if (counts.checking) return `Checking feeds · ${counts.live}/${counts.total}`;
    return `Feeds live · ${counts.live}/${counts.total}`;
  };

  return (
    <header class="topbar" role="banner">
      {/* Brand */}
      <div class="topbar-cluster">
        <AppLogo size={44}/>
        <span class="t-headline-md" style={{ 'font-weight': 500, 'letter-spacing': '-0.01em' }}>Aurora</span>
      </div>

      {/* Clock */}
      <div class="topbar-cluster" style={{ gap: '28px' }}>
        <div style={{ display: 'flex', 'align-items': 'baseline', gap: '10px' }}>
          <time class="t-display-sm t-num" style={{ 'font-weight': 300, 'letter-spacing': '-0.04em' }}>
            {hh()}:{mm()}
          </time>
          <span class="t-title-md muted t-mono" style={{ 'font-variation-settings': '"wght" 400' }}>:{ss()}</span>
        </div>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
          <span class="t-title-md">{day()}</span>
          <span class="t-body-sm muted">{date()}</span>
        </div>
      </div>

      {/* Status chips */}
      <div class="topbar-cluster" style={{ gap: '10px' }}>
        <span class="chip chip-outline">
          <MS name="location_on" size={16}/>
          {locationLabel()}
        </span>
        <span classList={{ chip: true, 'chip-good': feedHealthy(), 'chip-outline': !feedHealthy() }}>
          {feedHealthy() && <span class="live-dot" aria-hidden="true"/>}
          {feedLabel()}
        </span>
      </div>
    </header>
  );
}
