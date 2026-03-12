/* main function */

import { main } from "../main.js";
export function initTOC() {
  const utils = {
    navItems: document.querySelectorAll(".post-toc-wrap .post-toc li"),

    updateActiveTOCLink() {
      if (!Array.isArray(utils.sections)) return;
      let index = utils.sections.findIndex((element) => {
        return element && element.getBoundingClientRect().top - 100 > 0;
      });
      if (index === -1) {
        index = utils.sections.length - 1;
      } else if (index > 0) {
        index--;
      }
      this.activateTOCLink(index);
    },

    registerTOCScroll() {
      utils.sections = [
        ...document.querySelectorAll(".post-toc li a.nav-link"),
      ].map((element) => {
        const target = document.getElementById(
          decodeURI(element.getAttribute("href")).replace("#", ""),
        );
        return target;
      });
    },

    activateTOCLink(index) {
      const target = document.querySelectorAll(".post-toc li a.nav-link")[
        index
      ];

      if (!target || target.classList.contains("active-current")) {
        return;
      }

      document.querySelectorAll(".post-toc .active").forEach((element) => {
        element.classList.remove("active", "active-current");
      });
      target.classList.add("active", "active-current");
      // Scroll to the active TOC item
      const tocElement =
        document.querySelector(".post-toc .toc-nav-scroll") ||
        document.querySelector(".post-toc .nav");
      if (!tocElement) return;
      const tocTop = tocElement.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top - tocTop;
      const distanceToCenter =
        targetTop - tocElement.clientHeight / 2 + target.offsetHeight / 2;
      const scrollTop = tocElement.scrollTop + distanceToCenter;

      tocElement.scrollTo({
        top: scrollTop,
        behavior: "smooth", // Smooth scroll
      });
    },

    // showTOCAside removed

  };

  if (utils.navItems.length > 0) {
    // utils.showTOCAside();
    utils.registerTOCScroll();
  } else {
    document
      .querySelectorAll(".toc-content-container, .toc-marker")
      .forEach((elem) => {
        elem.remove();
      });
  }

  return utils;
}

// Event listeners
try {
  swup.hooks.on("page:view", () => {
    initTOC();
  });
} catch { }

document.addEventListener("DOMContentLoaded", initTOC);
