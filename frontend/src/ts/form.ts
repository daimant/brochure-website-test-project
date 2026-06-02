/**
 * form.ts — Contact form handling with validation, loading state,
 * and success/error feedback.
 */

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface FormData {
  name: string;
  phone: string;
  email: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof FormData, string>>;
}

export class ContactForm {
  private form!: HTMLFormElement;
  private submitBtn!: HTMLButtonElement;
  private statusEl!: HTMLElement;
  private fields!: Record<
    keyof FormData,
    HTMLInputElement | HTMLTextAreaElement
  >;
  private errorEls!: Record<keyof FormData, HTMLElement>;
  private isSubmitting = false;

  constructor() {
    const form = document.getElementById(
      "contact-form",
    ) as HTMLFormElement | null;
    if (!form) return;

    this.form = form;
    this.submitBtn = document.getElementById(
      "form-submit-btn",
    ) as HTMLButtonElement;
    this.statusEl = document.getElementById("form-status") as HTMLElement;

    this.fields = {
      name: document.getElementById("field-name") as HTMLInputElement,
      phone: document.getElementById("field-phone") as HTMLInputElement,
      email: document.getElementById("field-email") as HTMLInputElement,
      message: document.getElementById("field-message") as HTMLTextAreaElement,
    };

    this.errorEls = {
      name: document.getElementById("error-name") as HTMLElement,
      phone: document.getElementById("error-phone") as HTMLElement,
      email: document.getElementById("error-email") as HTMLElement,
      message: document.getElementById("error-message") as HTMLElement,
    };

    this.init();
  }

  private init(): void {
    this.form.addEventListener("submit", this.handleSubmit.bind(this));

    // Clear error on input
    (Object.keys(this.fields) as Array<keyof FormData>).forEach((key) => {
      this.fields[key].addEventListener("input", () => {
        this.clearFieldError(key);
      });
    });
  }

  private validate(): ValidationResult {
    const errors: Partial<Record<keyof FormData, string>> = {};

    const name = this.fields.name.value.trim();
    if (!name) {
      errors.name = "Введите ваше имя";
    } else if (name.length < 2) {
      errors.name = "Имя должно содержать не менее 2 символов";
    }

    const phone = this.fields.phone.value.trim();
    if (!phone) {
      errors.phone = "Введите номер телефона";
    } else if (!/^[+]?[\d\s\-().]{7,20}$/.test(phone)) {
      errors.phone = "Введите корректный номер телефона";
    }

    const email = this.fields.email.value.trim();
    if (!email) {
      errors.email = "Введите email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Введите корректный email";
    }

    const message = this.fields.message.value.trim();
    if (!message) {
      errors.message = "Напишите сообщение";
    } else if (message.length < 10) {
      errors.message = "Сообщение слишком короткое";
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  private showErrors(errors: Partial<Record<keyof FormData, string>>): void {
    (Object.keys(this.fields) as Array<keyof FormData>).forEach((key) => {
      if (errors[key]) {
        this.setFieldError(key, errors[key]!);
      } else {
        this.clearFieldError(key);
      }
    });
  }

  private setFieldError(key: keyof FormData, message: string): void {
    this.fields[key].classList.add("is-error");
    this.errorEls[key].textContent = message;
  }

  private clearFieldError(key: keyof FormData): void {
    this.fields[key].classList.remove("is-error");
    this.errorEls[key].textContent = "";
  }

  private clearAllErrors(): void {
    (Object.keys(this.fields) as Array<keyof FormData>).forEach((key) => {
      this.clearFieldError(key);
    });
  }

  private setLoading(loading: boolean): void {
    this.isSubmitting = loading;
    this.submitBtn.classList.toggle("is-loading", loading);
    this.submitBtn.disabled = loading;
    (
      Object.values(this.fields) as Array<
        HTMLInputElement | HTMLTextAreaElement
      >
    ).forEach((field) => {
      field.disabled = loading;
    });
  }

  private showStatus(type: "success" | "error", message: string): void {
    this.statusEl.className = `form-status form-status--${type}`;
    this.statusEl.textContent = message;
  }

  private clearStatus(): void {
    this.statusEl.className = "form-status";
    this.statusEl.textContent = "";
  }

  private getFormData(): FormData {
    return {
      name: this.fields.name.value.trim(),
      phone: this.fields.phone.value.trim(),
      email: this.fields.email.value.trim(),
      message: this.fields.message.value.trim(),
    };
  }

  private resetForm(): void {
    this.form.reset();
    this.clearAllErrors();
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (this.isSubmitting) return;

    this.clearStatus();
    const { valid, errors } = this.validate();

    if (!valid) {
      this.showErrors(errors);
      // Focus first errored field
      const firstErrorKey = (Object.keys(errors) as Array<keyof FormData>).find(
        (k) => errors[k],
      );
      if (firstErrorKey) {
        this.fields[firstErrorKey].focus();
      }
      return;
    }

    this.setLoading(true);
    const data = this.getFormData();

    try {
      const response = await fetch(`${VITE_API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = "Ошибка отправки. Попробуйте позже.";
        try {
          const json = (await response.json()) as { message?: string };
          if (json.message) errorMessage = json.message;
        } catch {
          // ignore JSON parse error
        }
        throw new Error(errorMessage);
      }

      this.resetForm();
      this.showStatus("success", "Спасибо! Ожидайте ответа.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Произошла ошибка. Попробуйте позже.";
      this.showStatus("error", message);
    } finally {
      this.setLoading(false);
    }
  }
}
