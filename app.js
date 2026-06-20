// === tools-briefing · Shared App Shell ===
// Particle field, navbar, scroll effects — loaded on every page
(function() {
  'use strict';

  // ════════════ Particle Canvas ════════════
  var canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var particles = [];
  var PARTICLE_COUNT = 80;
  var CONNECTION_DIST = 120;
  var mouseX = -1000, mouseY = -1000;
  var targetMouseX = -1000, targetMouseY = -1000;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Particle class
  function Particle() {
    this.reset();
  }
  Particle.prototype.reset = function() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.size = Math.random() * 1.5 + 0.5;
    this.opacity = Math.random() * 0.4 + 0.1;
    this.pulseSpeed = Math.random() * 0.02 + 0.005;
    this.pulseOffset = Math.random() * Math.PI * 2;
  };
  Particle.prototype.update = function() {
    // Subtle attraction to mouse
    var dx = targetMouseX - this.x;
    var dy = targetMouseY - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 200) {
      var force = (200 - dist) / 200 * 0.02;
      this.vx += dx * force * 0.01;
      this.vy += dy * force * 0.01;
    }
    // Damping
    this.vx *= 0.999;
    this.vy *= 0.999;
    this.x += this.vx;
    this.y += this.vy;
    // Wrap
    if (this.x < -20) this.x = canvas.width + 20;
    if (this.x > canvas.width + 20) this.x = -20;
    if (this.y < -20) this.y = canvas.height + 20;
    if (this.y > canvas.height + 20) this.y = -20;
  };
  Particle.prototype.draw = function() {
    var pulse = Math.sin(Date.now() * this.pulseSpeed + this.pulseOffset) * 0.3 + 0.7;
    var alpha = this.opacity * pulse;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(37, 99, 235, ' + alpha + ')';
    ctx.fill();
  };

  // Initialize
  for (var i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Smooth mouse follow
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    for (var i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    // Draw connections
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          var alpha = (1 - dist / CONNECTION_DIST) * 0.08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(8, 145, 178, ' + alpha + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }
  animate();

  // Mouse tracking
  document.addEventListener('mousemove', function(e) {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
  });
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 0) {
      targetMouseX = e.touches[0].clientX;
      targetMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  // ════════════ Navbar Scroll Effect ════════════
  var navbar = document.getElementById('navbar');
  var scrollTopBtn = document.getElementById('scrollTopBtn');

  function onScroll() {
    var y = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', y > 50);
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', y > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var toggler = document.getElementById('navbarToggler');
  var menu = document.getElementById('navbarMenu');
  if (toggler && menu) {
    toggler.addEventListener('click', function() {
      menu.classList.toggle('show');
      toggler.classList.toggle('active');
    });
    // Close on link click
    menu.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        menu.classList.remove('show');
        if (toggler) toggler.classList.remove('active');
      });
    });
  }

  // ════════════ Loading Bar ════════════
  var loadingBar = document.getElementById('loadingBar');
  if (loadingBar) {
    var w = 0;
    var t = setInterval(function() {
      if (w < 85) { w += Math.random() * 8 + 2; loadingBar.style.width = w + '%'; }
      else { clearInterval(t); }
    }, 120);
    window.addEventListener('load', function() {
      loadingBar.style.width = '100%';
      setTimeout(function() {
        loadingBar.style.opacity = '0';
        setTimeout(function() { if (loadingBar) loadingBar.remove(); }, 400);
      }, 200);
    });
  }

  // ════════════ Scroll-triggered Fade-in ════════════
  var fadeEls = document.querySelectorAll('.fade-in');
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  fadeEls.forEach(function(el) { observer.observe(el); });

  // ════════════ Animated Counters ════════════
  var counters = document.querySelectorAll('.counter[data-target]');
  var animatedCounters = new Set();

  function animateCounter(el) {
    if (animatedCounters.has(el)) return;
    animatedCounters.add(el);
    var target = parseInt(el.getAttribute('data-target'), 10);
    var duration = 1500;
    var startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * target);
      el.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString();
      }
    }
    requestAnimationFrame(step);
  }

  var counterObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) animateCounter(entry.target);
    });
  }, { threshold: 0.3 });

  counters.forEach(function(el) {
    counterObserver.observe(el);
    // Check if already visible
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setTimeout(function() { animateCounter(el); }, 300);
    }
  });

  // ════════════ Scroll-to-top button ════════════
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  console.log('[App] Shell initialized — particles, navbar, scroll effects');
})();
