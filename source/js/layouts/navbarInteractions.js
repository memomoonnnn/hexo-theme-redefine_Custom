export const navbarInteractions = {
  init() {
    this.togglenavbarDrawerShow();
    this.toggleSubmenu();
  },

  togglenavbarDrawerShow() {
    const domList = [
      document.querySelector(".window-mask"),
      document.querySelector(".navbar-bar"),
    ].filter(Boolean);

    if (document.querySelector(".navbar-drawer")) {
      domList.push(
        ...document.querySelectorAll(
          ".navbar-drawer .drawer-navbar-list .drawer-navbar-item",
        ),
        ...document.querySelectorAll(".navbar-drawer .tag-count-item"),
      );
    }

    domList.forEach((v) => {
      if (!v.dataset.navbarInitialized) {
        v.dataset.navbarInitialized = 1;
        v.addEventListener("click", () => {
          document.body.classList.toggle("navbar-drawer-show");
        });
      }
    });

    const logoTitleDom = document.querySelector(
      ".navbar-container .navbar-content .logo-title",
    );
    if (logoTitleDom && !logoTitleDom.dataset.navbarInitialized) {
      logoTitleDom.dataset.navbarInitialized = 1;
      logoTitleDom.addEventListener("click", () => {
        document.body.classList.remove("navbar-drawer-show");
      });
    }
  },

  toggleSubmenu() {
    const toggleElements = document.querySelectorAll("[navbar-data-toggle]");

    toggleElements.forEach((toggle) => {
      if (!toggle.dataset.eventListenerAdded) {
        toggle.dataset.eventListenerAdded = "true";
        toggle.addEventListener("click", function () {
          const target = document.querySelector(
            '[data-target="' + this.getAttribute("navbar-data-toggle") + '"]',
          );
          if (!target) {
            return;
          }

          const submenuItems = target.children;
          const icon = this.querySelector(".fa-chevron-right");

          const isVisible = !target.classList.contains("hidden");

          if (icon) {
            icon.classList.toggle("icon-rotated", !isVisible);
          }

          if (isVisible) {
            anime({
              targets: submenuItems,
              opacity: 0,
              translateY: -10,
              duration: 300,
              easing: "easeInQuart",
              delay: anime.stagger(80, { start: 20, direction: "reverse" }),
              complete: function () {
                target.classList.add("hidden");
              },
            });
          } else {
            target.classList.remove("hidden");

            anime({
              targets: submenuItems,
              opacity: [0, 1],
              translateY: [10, 0],
              duration: 300,
              easing: "easeOutQuart",
              delay: anime.stagger(80, { start: 20 }),
            });
          }
        });
      }
    });
  },
};

try {
  swup.hooks.on("page:view", () => {
    navbarInteractions.init();
  });
} catch { }

document.addEventListener("DOMContentLoaded", () => {
  navbarInteractions.init();
});
