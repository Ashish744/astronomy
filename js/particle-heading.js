document.addEventListener('DOMContentLoaded', () => {
  const headings = document.querySelectorAll('[data-particle-text]');

  headings.forEach((element) => {
    initParticleHeading(element);
  });

  function initParticleHeading(element) {
    const text = element.dataset.particleText || 'Stackly';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    element.appendChild(canvas);

    const palette = ['#ffffff', '#f97316', '#ffffff'];
    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let form = 0;
    let lastTime = 0;
    let pointer = { x: -99999, y: -99999, active: false };
    let smoothX = -99999;
    let smoothY = -99999;
    let mouseSpeed = 0;

    function resize() {
      const rect = element.getBoundingClientRect();
      width = Math.max(320, rect.width || 760);
      height = Math.max(160, rect.height || 180);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildParticles();
    }

    function buildParticles() {
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      const fontSize = Math.min(width * 0.075, 78);
      offCtx.clearRect(0, 0, width, height);
      offCtx.font = `700 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(text, width / 2, height / 2 + 2);

      const image = offCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = image.data;

      const raw = [];
      const stride = 4;
      for (let y = 0; y < canvas.height; y += stride) {
        for (let x = 0; x < canvas.width; x += stride) {
          const idx = (y * canvas.width + x) * 4 + 3;
          if (data[idx] > 120) {
            raw.push({ x, y });
          }
        }
      }

      particles = raw.map((dot, index) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.max(width, height) * (0.8 + Math.random() * 0.9);
        const spawnX = width / 2 + Math.cos(angle) * radius;
        const spawnY = height / 2 + Math.sin(angle) * radius;

        return {
          x: dot.x / dpr,
          y: dot.y / dpr,
          startX: spawnX,
          startY: spawnY,
          currentX: spawnX,
          currentY: spawnY,
          color: palette[index % palette.length],
          repX: 0,
          repY: 0,
        };
      });

      form = 0;
      lastTime = 0;
    }

    function updatePointer(event) {
      const rect = canvas.getBoundingClientRect();
      const px = (event.clientX - rect.left) * (width / rect.width);
      const py = (event.clientY - rect.top) * (height / rect.height);

      if (pointer.x > -9000) {
        const dx = px - pointer.x;
        const dy = py - pointer.y;
        mouseSpeed = Math.sqrt(dx * dx + dy * dy);
      }

      pointer.x = px;
      pointer.y = py;
      pointer.active = true;
    }

    function clearPointer() {
      pointer.x = -99999;
      pointer.y = -99999;
      pointer.active = false;
      mouseSpeed = 0;
    }

    function tick(timestamp) {
      ctx.clearRect(0, 0, width, height);

      if (!particles.length) {
        requestAnimationFrame(tick);
        return;
      }

      const dt = lastTime ? Math.min(32, timestamp - lastTime) : 16;
      lastTime = timestamp;

      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const target = 1;

      if (form < target) {
        form = Math.min(target, form + dt / 1000);
      }

      const active = pointer.active;
      const mouseRadius = 80;
      const mouseForce = 30;

      if (active) {
        const lerpFactor = Math.max(0.08, 0.26 - mouseSpeed * 0.006);
        if (smoothX < -9000) {
          smoothX = pointer.x;
          smoothY = pointer.y;
        } else {
          smoothX += (pointer.x - smoothX) * lerpFactor;
          smoothY += (pointer.y - smoothY) * lerpFactor;
        }
      } else {
        smoothX = -99999;
        smoothY = -99999;
      }

      const mx = smoothX;
      const my = smoothY;
      const cutoffSq = mouseRadius * mouseRadius;

      const factor = ease(form);

      particles.forEach((particle) => {
        const x = particle.x;
        const y = particle.y;
        const dx = x - mx;
        const dy = y - my;

        let inZone = false;

        if (active && dx * dx + dy * dy < cutoffSq) {
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;
          const falloff = 1 - dist / mouseRadius;
          const push = falloff * mouseSpeed * mouseForce * 0.05;

          particle.repX += nx * push;
          particle.repY += ny * push;

          const targetRepX = nx * (mouseRadius - dist);
          const targetRepY = ny * (mouseRadius - dist);
          particle.repX += (targetRepX - particle.repX) * 0.08;
          particle.repY += (targetRepY - particle.repY) * 0.08;
          inZone = true;
        }

        if (!inZone) {
          particle.repX *= 0.9;
          particle.repY *= 0.9;
        }

        const lerpX = particle.startX + (particle.x - particle.startX) * factor;
        const lerpY = particle.startY + (particle.y - particle.startY) * factor;
        particle.currentX = lerpX + particle.repX;
        particle.currentY = lerpY + particle.repY;
      });

      ctx.globalAlpha = 1;
      particles.forEach((particle) => {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.currentX - 1, particle.currentY - 1, 2, 2);
      });

      mouseSpeed *= 0.9;
      requestAnimationFrame(tick);
    }

    canvas.addEventListener('pointermove', updatePointer);
    canvas.addEventListener('pointerleave', clearPointer);
    canvas.addEventListener('pointercancel', clearPointer);

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);

    element._particleHeadingCleanup = () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', updatePointer);
      canvas.removeEventListener('pointerleave', clearPointer);
      canvas.removeEventListener('pointercancel', clearPointer);
    };
  }
});
