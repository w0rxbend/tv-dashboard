import { createSignal, onMount, onCleanup } from 'solid-js';
import TopBar      from './components/TopBar';
import AQICard     from './components/AQICard';
import WeatherCard from './components/WeatherCard';
import AgendaCard  from './components/AgendaCard';
import ChartCard   from './components/ChartCard';
import IndoorCard  from './components/IndoorCard';
import BottomStrip from './components/BottomStrip';

const DESIGN_W = 1920;
const DESIGN_H = 1080;

function Background() {
  return (
    <div aria-hidden="true">
      <div class="bg-blob" style={{ width: '700px', height: '700px', top: '-180px', left: '-180px', background: 'radial-gradient(circle, #1F3C73 0%, transparent 70%)' }}/>
      <div class="bg-blob" style={{ width: '600px', height: '600px', bottom: '-160px', right: '-120px', background: 'radial-gradient(circle, #71341B 0%, transparent 70%)', 'animation-delay': '-9s' }}/>
      <div class="bg-blob" style={{ width: '500px', height: '500px', top: '40%', left: '45%', background: 'radial-gradient(circle, #4F378B 0%, transparent 70%)', 'animation-delay': '-15s', opacity: 0.35 }}/>
    </div>
  );
}

export default function App() {
  const [scale, setScale] = createSignal({
    x: window.innerWidth  / DESIGN_W,
    y: window.innerHeight / DESIGN_H,
  });

  onMount(() => {
    const fit = () => setScale({ x: window.innerWidth / DESIGN_W, y: window.innerHeight / DESIGN_H });
    window.addEventListener('resize', fit);
    onCleanup(() => window.removeEventListener('resize', fit));
  });

  return (
    <div class="stage-wrap">
      <div class="stage" style={{ transform: `scale(${scale().x}, ${scale().y})` }}>
        <Background/>
        <div class="dash">
          <div class="area-topbar"><TopBar/></div>
          <div class="area-aqi"><AQICard/></div>
          <div class="area-wx"><WeatherCard/></div>
          <div class="area-agenda"><AgendaCard/></div>
          <div class="area-chart"><ChartCard/></div>
          <div class="area-indoor"><IndoorCard/></div>
          <div class="area-bottom"><BottomStrip/></div>
        </div>
      </div>
    </div>
  );
}
