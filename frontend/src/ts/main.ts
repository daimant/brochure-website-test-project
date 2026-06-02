/**
 * main.ts — Application entry point.
 * Initializes all interactive modules and runs the typewriter effect.
 */

import { ScrollAnimations } from "./scroll";
import { ContactForm } from "./form";
import { AiMessageGenerator } from "./ai-summary";

// ─── Typewriter effect ────────────────────────────────────────────────────────
class TypewriterEffect {
  private el: HTMLElement;
  private phrases: string[];
  private currentPhrase = 0;
  private currentChar = 0;
  private isDeleting = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Timings (ms)
  private readonly TYPE_SPEED = 80;
  private readonly DELETE_SPEED = 45;
  private readonly PAUSE_AFTER_TYPE = 2000;
  private readonly PAUSE_AFTER_DELETE = 400;

  constructor(el: HTMLElement, phrases: string[]) {
    this.el = el;
    this.phrases = phrases;
    this.tick();
  }

  private tick(): void {
    const phrase = this.phrases[this.currentPhrase];

    if (this.isDeleting) {
      this.currentChar--;
    } else {
      this.currentChar++;
    }

    this.el.textContent = phrase.slice(0, this.currentChar);

    let delay: number;

    if (!this.isDeleting && this.currentChar === phrase.length) {
      // Finished typing — pause then start deleting
      delay = this.PAUSE_AFTER_TYPE;
      this.isDeleting = true;
    } else if (this.isDeleting && this.currentChar === 0) {
      // Finished deleting — move to next phrase
      this.isDeleting = false;
      this.currentPhrase = (this.currentPhrase + 1) % this.phrases.length;
      delay = this.PAUSE_AFTER_DELETE;
    } else {
      delay = this.isDeleting ? this.DELETE_SPEED : this.TYPE_SPEED;
    }

    this.timeoutId = setTimeout(() => this.tick(), delay);
  }

  destroy(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
  }
}

// ─── Hamburger menu ───────────────────────────────────────────────────────────
function initHamburger(): void {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (!burger || !nav) return;

  burger.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(isOpen));
    burger.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  });

  // Close on nav link click (mobile)
  const navLinks = nav.querySelectorAll<HTMLAnchorElement>(".header__nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Открыть меню");
    });
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (
      nav.classList.contains("is-open") &&
      !nav.contains(e.target as Node) &&
      !burger.contains(e.target as Node)
    ) {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Открыть меню");
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Открыть меню");
      burger.focus();
    }
  });
}

// ─── Boot ────────────────────────────────────────────────────────────────────
function init(): void {
  // Hamburger nav (mobile)
  initHamburger();

  // Scroll animations + header
  new ScrollAnimations();

  // Contact form
  new ContactForm();

  // AI message generator for the textarea
  new AiMessageGenerator();

  // Typewriter for hero subtitle
  const typewriterEl = document.getElementById("typewriter");
  if (typewriterEl) {
    // Skip typewriter if user prefers reduced motion — show first phrase statically
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      typewriterEl.textContent = "Frontend Developer";
    } else {
      new TypewriterEffect(typewriterEl, [
        "Frontend Developer",
        "Vue 3 + React Expert",
        "UI/UX Enthusiast",
        "TypeScript Advocate",
        "AI-Powered Developer",
      ]);
    }
  }
}

// Run after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
