/**
 * ai-widget.ts — AI chat widget that POSTs questions to the backend,
 * shows a skeleton loader, and displays the response with a typing animation.
 */

interface AIResponse {
  answer: string;
}

export class AIWidget {
  private input!: HTMLInputElement;
  private button!: HTMLButtonElement;
  private responseEl!: HTMLElement;
  private isLoading = false;
  // Chars per tick for the typing animation
  private readonly TYPING_SPEED_MS = 22;

  constructor() {
    const input = document.getElementById(
      "ai-question",
    ) as HTMLInputElement | null;
    const button = document.getElementById(
      "ai-ask-btn",
    ) as HTMLButtonElement | null;
    const responseEl = document.getElementById(
      "ai-response",
    ) as HTMLElement | null;

    if (!input || !button || !responseEl) return;

    this.input = input;
    this.button = button;
    this.responseEl = responseEl;

    this.init();
  }

  private init(): void {
    this.button.addEventListener("click", () => void this.handleAsk());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void this.handleAsk();
      }
    });
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.button.disabled = loading;
    this.input.disabled = loading;

    if (loading) {
      this.button.textContent = "...";
    } else {
      this.button.textContent = "Спросить";
    }
  }

  private showSkeleton(): void {
    this.responseEl.innerHTML = `
      <div class="ai-skeleton" aria-label="Загрузка ответа">
        <div class="ai-skeleton__line"></div>
        <div class="ai-skeleton__line"></div>
        <div class="ai-skeleton__line"></div>
      </div>
    `;
  }

  private showError(message: string): void {
    this.responseEl.innerHTML = `
      <div class="ai-error">${this.escapeHtml(message)}</div>
    `;
  }

  private async typeResponse(text: string): Promise<void> {
    const wrapper = document.createElement("div");
    wrapper.className = "ai-response-text";

    const textNode = document.createTextNode("");
    const cursor = document.createElement("span");
    cursor.className = "ai-response-text__cursor";
    cursor.setAttribute("aria-hidden", "true");

    wrapper.appendChild(textNode);
    wrapper.appendChild(cursor);
    this.responseEl.innerHTML = "";
    this.responseEl.appendChild(wrapper);

    // Respect prefers-reduced-motion: show all text at once
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      textNode.textContent = text;
      cursor.remove();
      return;
    }

    let index = 0;
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (index < text.length) {
          textNode.textContent = text.slice(0, index + 1);
          index++;
          setTimeout(tick, this.TYPING_SPEED_MS);
        } else {
          cursor.remove();
          resolve();
        }
      };
      tick();
    });
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private async handleAsk(): Promise<void> {
    if (this.isLoading) return;

    const question = this.input.value.trim();
    if (!question) {
      this.input.focus();
      return;
    }

    this.setLoading(true);
    this.showSkeleton();

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        let errorMsg = "Не удалось получить ответ. Попробуйте позже.";
        try {
          const json = (await response.json()) as { message?: string };
          if (json.message) errorMsg = json.message;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const data = (await response.json()) as AIResponse;
      const answer = data.answer ?? "Ответ не получен.";
      await this.typeResponse(answer);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Произошла ошибка. Попробуйте позже.";
      this.showError(message);
    } finally {
      this.setLoading(false);
    }
  }
}
