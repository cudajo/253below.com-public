document.addEventListener("DOMContentLoaded", () => {
  const mountComponent = (selector, endpoint, onMounted) => {
    const mount = document.querySelector(selector);
    if (!mount) return;

    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${endpoint}`);
        return res.text();
      })
      .then((html) => {
        const temp = document.createElement("div");
        temp.innerHTML = html.trim();
        const element = temp.firstElementChild;

        if (onMounted) onMounted(element);

        mount.replaceWith(element);
      })
      .catch((err) => console.error(err));
  };

  // Nav mount with dynamic contextual back link
  mountComponent("#global-nav-mount", "/assets/includes/nav.html", (nav) => {
    const path = window.location.pathname;
    const segments = path.split("/").filter(Boolean);

    // Matches subpages like /pointus/help/ or /pointus/privacy/
    const ignoredTopLevels = ["assets", "legal", "privacy"];
    const isProductSubpage =
      segments.length >= 2 && !ignoredTopLevels.includes(segments[0].toLowerCase());

    if (isProductSubpage) {
      const productSlug = segments[0];
      const productName = productSlug.charAt(0).toUpperCase() + productSlug.slice(1);

      const brandLink = nav.querySelector(".brand-link") || nav.querySelector(".brand-logo");
      if (brandLink) {
        const backLink = document.createElement("a");
        backLink.href = `/${productSlug}/`;
        backLink.className = "nav-back-link";
        backLink.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>${productName}</span>
        `;

        brandLink.insertAdjacentElement("afterend", backLink);
      }
    }
  });

  // Footer mount with privacy path protection
  mountComponent("#global-footer-mount", "/assets/includes/footer.html", (footer) => {
    const privacyLink = footer.querySelector("#footer-privacy-link");
    if (!privacyLink) return;

    const path = window.location.pathname.toLowerCase();

    // Prevent duplicate nested paths when already on a privacy page
    if (path.includes("privacy")) {
      privacyLink.setAttribute("href", "./");
    }
  });

  initMediaLightbox();
  initCarousels();
});

function initMediaLightbox() {
  let modal = document.getElementById("media-lightbox-modal");
  if (!modal) {
    modal = document.createElement("dialog");
    modal.id = "media-lightbox-modal";
    modal.className = "media-lightbox";
    modal.innerHTML = '<img id="media-lightbox-img" src="" alt="Enlarged view" />';
    document.body.appendChild(modal);

    modal.addEventListener("click", () => modal.close());
  }

  const modalImg = modal.querySelector("#media-lightbox-img");

  document.querySelectorAll(".card-media img").forEach((img) => {
    img.addEventListener("click", (e) => {
      e.stopPropagation();
      modalImg.src = img.currentSrc || img.src;
      modalImg.alt = img.alt || "Enlarged view";
      modal.showModal();
    });
  });
}

function initCarousels() {
  document.querySelectorAll('.card-media.is-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.carousel-track');
    if (!track) return;

    const slides = track.querySelectorAll('img');
    if (slides.length <= 1) return;

    // 1. Create Arrow Buttons
    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-btn prev';
    prevBtn.setAttribute('aria-label', 'Previous slide');
    prevBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-btn next';
    nextBtn.setAttribute('aria-label', 'Next slide');
    nextBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    // 2. Create Indicator Dots
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    slides.forEach((_, index) => {
      const dot = document.createElement('span');
      dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
      dotsContainer.appendChild(dot);
    });

    carousel.appendChild(prevBtn);
    carousel.appendChild(nextBtn);
    carousel.appendChild(dotsContainer);

    const dots = dotsContainer.querySelectorAll('.carousel-dot');

    // Button event listeners
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
    });

    // Sync dots with track scroll position
    track.addEventListener('scroll', () => {
      const activeIndex = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeIndex);
      });
    }, { passive: true });
  });
}