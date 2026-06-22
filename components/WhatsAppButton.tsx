"use client";

import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  label?: string;
  variant?: "floating" | "inline";
  className?: string;
}

/**
 * WhatsAppButton — generic button that opens a WhatsApp chat.
 * - variant="floating": fixed bottom-right circle (mobile/desktop)
 * - variant="inline": inline button (used in checkout)
 */
export function WhatsAppButton({
  phone,
  message,
  label = "Hablar por WhatsApp",
  variant = "floating",
  className,
}: WhatsAppButtonProps) {
  const digits = phone.replace(/\D/g, "");
  const url = `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

  if (variant === "inline") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-soko-cta px-6 font-label-caps text-label-caps text-on-primary transition-all duration-200 ease-out-quart hover:shadow-glow active:scale-[0.98] ${className ?? ""}`}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        {label}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`fixed bottom-24 right-4 z-nav-sticky inline-flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary shadow-glow transition-transform duration-200 ease-out-quart hover:scale-110 active:scale-95 md:bottom-6 ${className ?? ""}`}
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}
