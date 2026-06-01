/**
 * scroll.ts — IntersectionObserver-based reveal animations,
 * smooth anchor scrolling, and header background on scroll.
 */

export class ScrollAnimations {
  private observer: IntersectionObserver
  private header: HTMLElement | null
  private navLinks: NodeListOf<HTMLAnchorElement>

  constructor() {
    this.header = document.querySelector('.header')
    this.navLinks = document.querySelectorAll<HTMLAnchorElement>('.header__nav-link')

    this.observer = new IntersectionObserver(this.onIntersect.bind(this), {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    })

    this.init()
  }

  private init(): void {
    // Observe all reveal elements
    const elements = document.querySelectorAll<HTMLElement>('.reveal')
    elements.forEach((el) => this.observer.observe(el))

    // Scroll-based header background
    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true })
    this.onScroll() // Run once on init

    // Smooth anchor scroll for all nav links
    this.initAnchorLinks()

    // Active nav link on scroll
    this.initActiveNavHighlight()
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        // Once revealed, stop observing to save resources
        this.observer.unobserve(entry.target)
      }
    })
  }

  private onScroll(): void {
    if (!this.header) return
    if (window.scrollY > 20) {
      this.header.classList.add('is-scrolled')
    } else {
      this.header.classList.remove('is-scrolled')
    }
  }

  private initAnchorLinks(): void {
    const anchorLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
    anchorLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href')
        if (!href || href === '#') return

        const target = document.querySelector<HTMLElement>(href)
        if (!target) return

        e.preventDefault()

        const headerHeight = this.header?.offsetHeight ?? 64
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight

        window.scrollTo({
          top,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        })
      })
    })
  }

  private initActiveNavHighlight(): void {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('section[id], header[id]')
    )

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id')
            this.navLinks.forEach((link) => {
              const href = link.getAttribute('href')
              if (href === `#${id}`) {
                link.classList.add('is-active')
              } else {
                link.classList.remove('is-active')
              }
            })
          }
        })
      },
      {
        threshold: 0.35,
        rootMargin: '-64px 0px 0px 0px',
      }
    )

    sections.forEach((section) => sectionObserver.observe(section))
  }
}
