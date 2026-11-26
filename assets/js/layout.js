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
    modal.innerHTML = '<div id="media-lightbox-content"></div>';
    document.body.appendChild(modal);

    const closeModal = () => {
      const activeVideo = modal.querySelector("video");
      if (activeVideo) {
        activeVideo.pause();
      }
      modal.close();
      const content = modal.querySelector("#media-lightbox-content");
      if (content) content.innerHTML = "";
    };

    // Close on backdrop click (clicking outside the enlarged image/video)
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.id === "media-lightbox-content") {
        closeModal();
      }
    });

    // Handle Escape key dismissal
    modal.addEventListener("cancel", () => closeModal());
  }

  const modalContent = modal.querySelector("#media-lightbox-content");

  // Matches card media as well as any standalone image/video with data-zoomable or .is-zoomable
  const zoomableSelector = ".card-media img, .card-media video, img[data-zoomable], video[data-zoomable], img.is-zoomable, video.is-zoomable";

  document.querySelectorAll(zoomableSelector).forEach((media) => {
    media.addEventListener("click", (e) => {
      e.stopPropagation();
      modalContent.innerHTML = "";

      if (media.tagName === "VIDEO") {
        const modalVideo = document.createElement("video");
        modalVideo.id = "media-lightbox-video";
        modalVideo.autoplay = true;
        modalVideo.loop = true;
        modalVideo.muted = true;
        modalVideo.playsInline = true;
        modalVideo.controls = true;

        if (media.children.length > 0) {
          modalVideo.innerHTML = media.innerHTML;
        } else {
          modalVideo.src = media.currentSrc || media.src;
        }

        // Keep playback position in sync
        modalVideo.currentTime = media.currentTime;

        modalContent.appendChild(modalVideo);
      } else {
        const modalImg = document.createElement("img");
        modalImg.id = "media-lightbox-img";
        modalImg.src = media.currentSrc || media.src;
        modalImg.alt = media.alt || "Enlarged view";
        modalImg.addEventListener("click", () => modal.close());
        modalContent.appendChild(modalImg);
      }

      modal.showModal();
    });
  });
}

function initCarousels() {
  document.querySelectorAll(".card-media.is-carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    if (!track) return;

    // Detect both <img> and <video> slides
    const slides = Array.from(track.querySelectorAll("img, video"));
    if (slides.length <= 1) return;

    // 1. Create Arrow Buttons
    const prevBtn = document.createElement("button");
    prevBtn.className = "carousel-btn prev";
    prevBtn.setAttribute("aria-label", "Previous slide");
    prevBtn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';

    const nextBtn = document.createElement("button");
    nextBtn.className = "carousel-btn next";
    nextBtn.setAttribute("aria-label", "Next slide");
    nextBtn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    // 2. Create Indicator Dots
    const dotsContainer = document.createElement("div");
    dotsContainer.className = "carousel-dots";
    slides.forEach((_, index) => {
      const dot = document.createElement("span");
      dot.className = `carousel-dot ${index === 0 ? "active" : ""}`;
      dotsContainer.appendChild(dot);
    });

    carousel.appendChild(prevBtn);
    carousel.appendChild(nextBtn);
    carousel.appendChild(dotsContainer);

    const dots = dotsContainer.querySelectorAll(".carousel-dot");

    // Scroll helper targeting exact slide boundaries
    const scrollToSlide = (index) => {
      const targetIndex = Math.max(0, Math.min(index, slides.length - 1));
      slides[targetIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    };

    // Button event listeners
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentIndex = Math.round(track.scrollLeft / track.clientWidth);
      scrollToSlide(currentIndex - 1);
    });

    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentIndex = Math.round(track.scrollLeft / track.clientWidth);
      scrollToSlide(currentIndex + 1);
    });

    // Sync dots and manage video play/pause lifecycle on scroll
    const updateActiveSlide = () => {
      const activeIndex = Math.round(track.scrollLeft / track.clientWidth);

      // Sync indicator dots
      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === activeIndex);
      });

      // Play video only when active on screen to conserve CPU/battery
      slides.forEach((slide, index) => {
        if (slide.tagName === "VIDEO") {
          if (index === activeIndex) {
            slide.play().catch(() => {});
          } else {
            slide.pause();
          }
        }
      });
    };

    track.addEventListener("scroll", updateActiveSlide, { passive: true });
  });
}