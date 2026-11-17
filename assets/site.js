(() => {
  'use strict';
  const nav = document.getElementById('mainNav');
  const menuButton = document.getElementById('mobileMenuBtn');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menuButton.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  };
  menuButton.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      menuButton.focus();
    }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', () => setMenu(false));

  let dialogTrigger = null;
  let articleReturnUrl = null;
  const openDialog = (id, trigger) => {
    const dialog = document.getElementById(id);
    if (!dialog || dialog.open) return;
    dialogTrigger = trigger || document.activeElement;
    if (id === 'articlesDialog') {
      renderArticles();
      if (location.hash !== '#artigos') {
        articleReturnUrl = location.pathname + location.search + location.hash;
        history.replaceState(null, '', '#artigos');
      }
    }
    dialog.showModal();
    document.body.classList.add('dialog-open');
  };
  document.querySelectorAll('[data-dialog]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      openDialog(trigger.dataset.dialog, trigger);
    });
  });
  document.querySelectorAll('.site-dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      if (dialog.id === 'articlesDialog' && location.hash === '#artigos') {
        history.replaceState(null, '', articleReturnUrl || location.pathname + location.search);
        articleReturnUrl = null;
      }
      if (dialogTrigger instanceof HTMLElement) dialogTrigger.focus({ preventScroll: true });
    });
  });

  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  async function renderArticles() {
    const container = document.getElementById('articlesContainer');
    let data;
    try {
      data = typeof loadSiteData === 'function' ? await loadSiteData() : getSiteData();
    } catch {
      // Se o navegador bloquear o armazenamento, mantém os artigos padrão disponíveis.
    }
    if (!data && typeof DEFAULT_SITE_DATA !== 'undefined') data = DEFAULT_SITE_DATA;
    const articles = Array.isArray(data?.artigos) ? data.artigos : [];
    container.replaceChildren();
    if (!articles.length) {
      container.append(make('p', 'article-summary', 'Nenhum artigo disponível no momento.'));
      return;
    }
    articles.forEach(article => {
      const card = make('article', 'article-card');
      if (article.imagem) {
        let imageUrl;
        try {
          const candidate = new URL(article.imagem, location.href);
          if (['http:', 'https:', 'file:'].includes(candidate.protocol)) imageUrl = candidate.href;
        } catch { /* Uma imagem inválida não impede a leitura do artigo. */ }
        if (imageUrl) {
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = '';
          img.loading = 'lazy';
          img.addEventListener('error', () => img.remove(), { once: true });
          card.append(img);
        }
      }
      const body = make('div', 'article-card-body');
      body.append(make('p', 'article-category', article.categoria || 'Artigo técnico'));
      const title = make('h3');
      const href = 'artigo.html?id=' + encodeURIComponent(article.id);
      const link = make('a', '', article.titulo || 'Ler artigo');
      link.href = href;
      title.append(link);
      body.append(title);
      body.append(make('p', 'article-meta', [article.data, article.tempoLeitura].filter(Boolean).join(' • ')));
      body.append(make('p', 'article-summary', article.resumo));
      const read = make('a', 'article-read', 'Ler artigo completo →');
      read.href = href;
      body.append(read);
      card.append(body);
      container.append(card);
    });
  }

  window.addEventListener('storage', event => {
    if (event.key === 'rafael_leite_pericias_data' && document.getElementById('articlesDialog').open) renderArticles();
  });

  document.getElementById('contactForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const message = [
      '*Nova Solicitação — Rafael Leite Perícias*', '',
      '*Nome:* ' + fields.get('nome').trim(),
      '*Telefone:* ' + fields.get('telefone').trim(),
      '*E-mail:* ' + fields.get('email').trim(),
      '*Tipo de Demanda:* ' + fields.get('tipo'),
      '*Mensagem:* ' + fields.get('mensagem').trim()
    ].join('\n');
    const link = document.createElement('a');
    link.href = 'https://wa.me/' + (window.RAFAEL_CONTACT_WHATSAPP || '5531987199241') + '?text=' + encodeURIComponent(message);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  });

  const sectionLinks = [...nav.querySelectorAll('a:not([data-dialog])')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(link => {
          const current = link.hash === '#' + entry.target.id;
          link.classList.toggle('active', current);
          if (current) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-10% 0px -65% 0px' });
    sectionLinks.forEach(link => {
      const section = document.querySelector(link.hash);
      if (section) observer.observe(section);
    });
  }
  const openArticlesFromHash = () => {
    if (location.hash === '#artigos') openDialog('articlesDialog');
  };
  window.addEventListener('hashchange', openArticlesFromHash);
  openArticlesFromHash();
  document.getElementById('copyrightYear').textContent = String(new Date().getFullYear());
})();
