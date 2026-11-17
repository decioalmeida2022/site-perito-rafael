/* Integração somente de conteúdo público com Pages CMS.
 * O CMS salva os JSONs no GitHub; este script os lê sem expor credenciais. */
(async () => {
  async function read(path) {
    const response = await fetch(path, {cache: 'no-store'});
    if (!response.ok) throw new Error(path + ': HTTP ' + response.status);
    return response.json();
  }
  try {
    const [perfil, servicos, contato] = await Promise.all([
      read('content/perfil.json'), read('content/servicos.json'), read('content/contato.json')
    ]);
    if (perfil && typeof perfil.descricao === 'string') {
      const el = document.querySelector('.about-copy > p:not(.eyebrow)');
      if (el) el.textContent = perfil.descricao;
    }
    if (perfil && perfil.imagem_principal) {
      // CSS custom property preserva o enquadramento desktop e celular.
      const path = String(perfil.imagem_principal);
      if (/^(https?:\\/\\/|assets\\/)[^"'()\\s]+$/i.test(path)) {
        document.documentElement.style.setProperty('--cms-hero-image', 'url("' + path + '")');
      }
    }
    if (servicos && Array.isArray(servicos.servicos)) {
      const cards = document.querySelectorAll('.service-grid .service-card');
      servicos.servicos.forEach((item, idx) => {
        if (!cards[idx] || !item) return;
        const h = cards[idx].querySelector('h3');
        const p = cards[idx].querySelector('p');
        if (h && item.titulo) h.textContent = item.titulo;
        if (p && item.descricao) p.textContent = item.descricao;
      });
    }
    if (contato && /^\d{10,15}$/.test(String(contato.whatsapp || ''))) {
      window.RAFAEL_CONTACT_WHATSAPP = String(contato.whatsapp);
      document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a => {
        const current = new URL(a.href);
        a.href = 'https://wa.me/' + window.RAFAEL_CONTACT_WHATSAPP + current.search;
      });
    }
    if (contato && contato.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
        a.href = 'mailto:' + contato.email;
        if (a.textContent.includes('@')) a.textContent = contato.email;
      });
    }
  } catch (error) {
    console.warn('Conteúdo CMS indisponível; mantendo dados do HTML.', error);
  }
})();
