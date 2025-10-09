import { styled, keyframes } from 'styled-components';
import { useRef, useState } from 'react';

const hue = keyframes`
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
`;

const floatPulse = keyframes`
  0%, 100% { transform: translateY(0) scale(1); opacity: .9; }
  50% { transform: translateY(-2px) scale(1.05); opacity: 1; }
`;

const Wrapper = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--card-border, #2a2f3a);
  background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
  color: var(--header-fg, #e6e6e6);
  border-radius: 10px;
  cursor: pointer;
  outline: none;
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
  -webkit-tap-highlight-color: transparent;
  &:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,.2); border-color: rgba(110,168,254,.6); }
  @media (max-width: 640px) { gap: 6px; padding: 6px; }
  position: relative;
  overflow: hidden;
`;

const Badge = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: conic-gradient(from 120deg, #6ea8fe, #8a6efd, #e056fd, #6ea8fe);
  animation: ${hue} 6s linear infinite;
  position: relative;
  display: inline-block;
  box-shadow: 0 0 0 1px rgba(255,255,255,.06) inset;
  &::after {
    content: '';
    position: absolute;
    right: -5px;
    top: -5px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #6ea8fe;
    box-shadow: 0 0 10px rgba(110,168,254,.8);
    animation: ${floatPulse} 2s ease-in-out infinite;
  }
`;

const Title = styled.span`
  font-weight: 800;
  letter-spacing: .3px;
  background: linear-gradient(90deg, #e6ecff, #a4b8ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 14px;
  @media (max-width: 640px) { display: none; }
`;

const TitleShort = styled.span`
  font-weight: 800;
  letter-spacing: .4px;
  background: linear-gradient(90deg, #e6ecff, #a4b8ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 14px;
  display: none;
  @media (max-width: 640px) { display: inline; }
`;

export default function Logo() {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const [fast, setFast] = useState(false);
  const [, setClicks] = useState(0);

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursor({ x, y });
  }

  function goHome() { window.location.hash = 'problems-home'; }

  function showEncouragement() {
    try {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        display: grid; place-items: center;
        background: radial-gradient(1200px circle at 50% 40%, rgba(110,168,254,.18), transparent 60%),
                    linear-gradient(180deg, rgba(10,12,20,.9), rgba(10,12,20,.96));
        backdrop-filter: blur(6px);
        opacity: 0; transition: opacity .35s ease;
      `;
      const card = document.createElement('div');
      card.style.cssText = `
        padding: 28px 32px; border-radius: 16px;
        border: 1px solid rgba(255,255,255,.08);
        background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
        box-shadow: 0 10px 40px rgba(0,0,0,.45);
        transform: scale(.96); opacity: .9; transition: transform .35s ease, opacity .35s ease;
        text-align: center; max-width: 720px; width: calc(100% - 32px);
      `;
      const title = document.createElement('div');
      title.textContent = 'Продолжай учиться — у тебя всё получится!';
      title.style.cssText = `
        font-size: clamp(18px, 4vw, 28px); font-weight: 900;
        background: linear-gradient(90deg, #e6ecff, #a4b8ff, #6ea8fe);
        -webkit-background-clip: text; background-clip: text; color: transparent;
        letter-spacing: .3px; margin-bottom: 8px;
      `;
      const subtitle = document.createElement('div');
      subtitle.textContent = 'Маленькие шаги каждый день приводят к большим результатам.';
      subtitle.style.cssText = `
        font-size: clamp(12px, 2.5vw, 14px); opacity: .85; color: #e2e8f0;
      `;
      // gentle floating particles
      const stars = document.createElement('div');
      stars.style.cssText = 'position:absolute; inset:0; pointer-events:none; overflow:hidden;';
      for (let i = 0; i < 42; i++) {
        const s = document.createElement('span');
        const size = Math.random() * 2 + 1;
        s.style.cssText = `
          position:absolute; width:${size}px; height:${size}px; border-radius:50%;
          background: rgba(110,168,254,${Math.random()*.7+.2});
          left:${Math.random()*100}%; top:${Math.random()*100}%;
          filter: blur(.2px);
          animation: floatY ${6 + Math.random()*6}s ease-in-out ${Math.random()*-6}s infinite alternate;
        `;
        stars.appendChild(s);
      }
      const style = document.createElement('style');
      style.textContent = `@keyframes floatY { from { transform: translateY(-6px) } to { transform: translateY(6px) } }`;
      document.head.appendChild(style);

      card.appendChild(title);
      card.appendChild(subtitle);
      overlay.appendChild(stars);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => { overlay.style.opacity = '1'; card.style.transform = 'scale(1)'; card.style.opacity = '1'; });
      function close() {
        overlay.style.opacity = '0'; card.style.transform = 'scale(.96)'; card.style.opacity = '.9';
        setTimeout(() => overlay.remove(), 350);
      }
      overlay.addEventListener('click', close);
      setTimeout(close, 2400);
    } catch {}
  }

  return (
    <Wrapper ref={ref} onMouseMove={handleMove} onMouseLeave={() => setCursor({ x: 50, y: 50 })}
             onClick={(e) => { e.preventDefault(); setFast((v) => !v); goHome(); setClicks(c=>{ const n=c+1; if(n>=5){ showEncouragement(); return 0;} return n;}); }} aria-label="PetTasks Home">
      <Badge style={{ animationDuration: fast ? '2s' : '6s' }} />
      <Title>PetTasks</Title>
      <TitleShort>PT</TitleShort>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(320px circle at ${cursor.x}% ${cursor.y}%, rgba(110,168,254,.18), transparent 60%)` }} />
    </Wrapper>
  );
}


