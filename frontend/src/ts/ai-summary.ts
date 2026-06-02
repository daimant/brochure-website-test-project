/**
 * ai-summary.ts — AI message generator for the contact form textarea.
 * Calls the backend /api/ai-generate endpoint (Groq LLaMA, free tier)
 * and inserts the generated text into #field-message.
 */

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export class AiMessageGenerator {
  private textarea!: HTMLTextAreaElement;
  private btn!: HTMLButtonElement;
  private btnText!: HTMLElement;
  private nameField!: HTMLInputElement;

  constructor() {
    const textarea = document.getElementById(
      "field-message",
    ) as HTMLTextAreaElement | null;
    const btn = document.getElementById(
      "ai-generate-btn",
    ) as HTMLButtonElement | null;
    const nameField = document.getElementById(
      "field-name",
    ) as HTMLInputElement | null;

    if (!textarea || !btn || !nameField) return;

    this.textarea = textarea;
    this.btn = btn;
    this.btnText = btn.querySelector(".ai-generate-btn__text") as HTMLElement;
    this.nameField = nameField;

    this.init();
  }

  private init(): void {
    this.btn.addEventListener("click", () => void this.handleGenerate());
  }

  private async handleGenerate(): Promise<void> {
    if (this.btn.disabled) return;

    this.setLoading(true);

    const context = this.nameField.value.trim();

    try {
      const response = await fetch(`${VITE_API_URL}/api/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context ? { context } : {}),
      });

      if (!response.ok) {
        let msg = "Ошибка генерации. Попробуйте позже.";
        try {
          const json = (await response.json()) as { message?: string };
          if (json.message) msg = json.message;
        } catch {
          // ignore JSON parse error
        }
        throw new Error(msg);
      }

      const data = (await response.json()) as {
        success: boolean;
        text: string;
      };

      if (data.text) {
        this.textarea.value = data.text;
        // Notify form validation to clear any existing error on this field
        this.textarea.dispatchEvent(new Event("input"));
        this.autoResize();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ошибка генерации.";
      this.showError(msg);
    } finally {
      this.setLoading(false);
    }
  }

  private setLoading(on: boolean): void {
    this.btn.disabled = on;
    this.btn.classList.toggle("is-loading", on);
    if (this.btnText) {
      this.btnText.textContent = on ? "Генерирую..." : "Сгенерировать пример";
    }
  }

  private showError(message: string): void {
    console.error("[ai-generate]", message);
    if (this.btnText) this.btnText.textContent = "⚠ Ошибка";
    setTimeout(() => {
      if (this.btnText) this.btnText.textContent = "Сгенерировать пример";
    }, 2500);
  }

  private autoResize(): void {
    this.textarea.style.height = "auto";
    this.textarea.style.height = `${this.textarea.scrollHeight}px`;
  }
}
