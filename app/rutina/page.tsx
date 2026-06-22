"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
  Sun,
  Moon,
  RefreshCw,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/Button";
import { GlowChip } from "@/components/GlowChip";
import { DualPrice } from "@/components/DualPrice";
import { cn } from "@/components/Button";
import type { Product } from "@/lib/database.types";

type SkinType = "seca" | "grasa" | "mixta" | "sensible";
type AgeRange = "18-25" | "26-35" | "36-45" | "46+";
type Experience = "principiante" | "intermedio" | "avanzado";
type TimeOfDay = "mañana" | "noche" | "ambos";

interface RoutineStep {
  step: string;
  product_slug: string;
  reason: string;
}
interface Routine {
  morning: RoutineStep[];
  evening: RoutineStep[];
  tips: string[];
  summary: string;
}

/* ============================================================
   Client-side rate limit (server is source of truth).
   localStorage just avoids an extra round-trip when the user
   is already at the limit.
   ============================================================ */

const DAILY_LIMIT = 3;
const STORAGE_KEY = "soko_routine_count";
const STORAGE_DATE_KEY = "soko_routine_date";

function todayLocal(): string {
  return new Date().toISOString().slice(0, 10);
}

function getUsage(): { date: string; count: number } {
  if (typeof window === "undefined") return { date: todayLocal(), count: 0 };
  try {
    const date = localStorage.getItem(STORAGE_DATE_KEY) ?? todayLocal();
    const count = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    if (date !== todayLocal()) {
      localStorage.setItem(STORAGE_DATE_KEY, todayLocal());
      localStorage.setItem(STORAGE_KEY, "0");
      return { date: todayLocal(), count: 0 };
    }
    return { date, count: isNaN(count) ? 0 : count };
  } catch {
    return { date: todayLocal(), count: 0 };
  }
}

function setUsage(count: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_DATE_KEY, todayLocal());
    localStorage.setItem(STORAGE_KEY, String(count));
  } catch {
    /* ignore */
  }
}

/* ============================================================
   Form options
   ============================================================ */

const SKIN_TYPES: Array<{ key: SkinType; label: string; desc: string }> = [
  { key: "seca", label: "Seca", desc: "Tensa, escamada, se siente tirante" },
  { key: "grasa", label: "Grasa", desc: "Brilla, poros visibles, propensa al acné" },
  { key: "mixta", label: "Mixta", desc: "Brilla en la zona T, seca en mejillas" },
  { key: "sensible", label: "Sensible", desc: "Se enrojece, reacciona a productos" },
];

const CONCERNS: Array<{ key: string; label: string; emoji: string }> = [
  { key: "hidratacion", label: "Hidratación", emoji: "💧" },
  { key: "acne", label: "Acné / granitos", emoji: "🎯" },
  { key: "antiedad", label: "Anti-edad", emoji: "⏳" },
  { key: "brillo", label: "Control de brillo", emoji: "✨" },
  { key: "calmante", label: "Calmante / rojeces", emoji: "🌸" },
  { key: "proteccion", label: "Protección solar", emoji: "☀️" },
];

const AGE_RANGES: Array<{ key: AgeRange; label: string }> = [
  { key: "18-25", label: "18–25" },
  { key: "26-35", label: "26–35" },
  { key: "36-45", label: "36–45" },
  { key: "46+", label: "46 o más" },
];

const EXPERIENCES: Array<{ key: Experience; label: string; desc: string }> = [
  { key: "principiante", label: "Principiante", desc: "Es mi primera rutina" },
  { key: "intermedio", label: "Intermedio", desc: "Ya uso limpiador + hidratante" },
  { key: "avanzado", label: "Avanzado", desc: "Conozco los 10 pasos" },
];

const TIME_OF_DAY: Array<{
  key: TimeOfDay;
  label: string;
  desc: string;
  icon: typeof Sun;
}> = [
  { key: "mañana", label: "Solo de mañana", desc: "Rutina AM", icon: Sun },
  { key: "noche", label: "Solo de noche", desc: "Rutina PM", icon: Moon },
  { key: "ambos", label: "Mañana y noche", desc: "Rutina completa", icon: Sparkles },
];

const STEPS = [
  { id: 0, title: "Tu tipo de piel", subtitle: "1 de 4" },
  { id: 1, title: "Tus preocupaciones", subtitle: "2 de 4" },
  { id: 2, title: "Edad y experiencia", subtitle: "3 de 4" },
  { id: 3, title: "Cuándo quieres la rutina", subtitle: "4 de 4" },
];

/* ============================================================
   Page
   ============================================================ */

export default function RutinaPage() {
  const [step, setStep] = useState(0);
  const [skinType, setSkinType] = useState<SkinType | null>(null);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [result, setResult] = useState<{
    routine: Routine;
    products: Product[];
  } | null>(null);

  const [usage, setUsageState] = useState<{ date: string; count: number }>({
    date: "",
    count: 0,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUsageState(getUsage());
    setHydrated(true);
  }, []);

  const limitReached = hydrated && usage.count >= DAILY_LIMIT;
  const remaining = hydrated ? Math.max(0, DAILY_LIMIT - usage.count) : DAILY_LIMIT;

  function toggleConcern(c: string) {
    setConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function canAdvance(): boolean {
    if (step === 0) return skinType !== null;
    if (step === 1) return concerns.length > 0;
    if (step === 2) return ageRange !== null && experience !== null;
    if (step === 3) return timeOfDay !== null;
    return false;
  }

  async function handleSubmit() {
    if (!skinType || !ageRange || !experience || !timeOfDay) return;
    if (limitReached) return;
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await fetch("/api/rutina/recomendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skin_type: skinType,
          concerns,
          age_range: ageRange,
          time_of_day: timeOfDay,
          experience,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo generar la rutina. Intenta de nuevo.");
        setErrorCode(data.code ?? null);
        // If the server says we're at the limit, sync the local counter
        if (data.code === "RATE_LIMIT") {
          setUsage(DAILY_LIMIT);
          setUsageState(getUsage());
        }
        return;
      }
      // Bump local counter (server is source of truth, this is just UX)
      const newCount = usage.count + 1;
      setUsage(newCount);
      setUsageState({ date: todayLocal(), count: newCount });
      // Fetch the actual products (we need their details for the display)
      const productsRes = await fetch(
        "/api/rutina/productos?slugs=" +
          data.routine.morning
            .concat(data.routine.evening)
            .map((s: RoutineStep) => s.product_slug)
            .join(",")
      );
      const productsData = productsRes.ok
        ? await productsRes.json()
        : { products: [] };
      setResult({ routine: data.routine, products: productsData.products ?? [] });
    } catch {
      setError("Error de conexión. Intenta de nuevo 💜");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setErrorCode(null);
    setStep(0);
    setSkinType(null);
    setConcerns([]);
    setAgeRange(null);
    setExperience(null);
    setTimeOfDay(null);
  }

  /* ── Result view ── */
  if (result) {
    const productBySlug = new Map(result.products.map((p) => [p.slug, p]));
    return (
      <main className="min-h-screen bg-background pb-40 pt-20 md:pb-24">
        <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop">
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed/30 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-label-caps text-label-caps text-primary">
                Tu Rutina Personalizada
              </p>
              <h1 className="font-headline-md text-headline-sm text-on-surface">
                Glass Skin Plan
              </h1>
            </div>
          </div>

          <p className="mb-8 max-w-prose rounded-md border-l-4 border-primary bg-primary-fixed/10 p-4 font-body-md text-body-md text-on-surface">
            {result.routine.summary}
          </p>

          {result.routine.morning.length > 0 && (
            <RoutineSection
              title="Mañana"
              icon={Sun}
              steps={result.routine.morning}
              productBySlug={productBySlug}
            />
          )}

          {result.routine.evening.length > 0 && (
            <RoutineSection
              title="Noche"
              icon={Moon}
              steps={result.routine.evening}
              productBySlug={productBySlug}
            />
          )}

          {result.routine.tips.length > 0 && (
            <section className="mt-10">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Tips para tu rutina
              </h2>
              <ul className="mt-4 space-y-2">
                {result.routine.tips.map((t, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-md bg-surface-container-low p-3 font-body-md text-body-md text-on-surface"
                  >
                    <Check
                      className="mt-1 h-4 w-4 flex-shrink-0 text-tertiary-container"
                      aria-hidden="true"
                    />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {!limitReached ? (
              <Button
                variant="secondary"
                onClick={handleReset}
                leadingIcon={<RefreshCw className="h-4 w-4" />}
              >
                Generar otra rutina
              </Button>
            ) : (
              <div className="flex-1 rounded-md border border-outline-variant/30 bg-surface-container-low p-3 font-body-sm text-body-sm text-on-surface-variant">
                Ya alcanzaste tus {DAILY_LIMIT} rutinas de hoy. Vuelve mañana ✨
              </div>
            )}
            <Link href="/productos" className="flex-1">
              <Button
                variant="primary"
                fullWidth
                trailingIcon={<ArrowRight className="h-4 w-4" />}
              >
                Ver todo el catálogo
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ── Limit reached (full-page friendly state) ── */
  if (limitReached) {
    return (
      <main className="min-h-screen bg-background pb-40 pt-20 md:pb-24">
        <div className="mx-auto max-w-2xl px-margin-mobile md:px-margin-desktop">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Inicio
          </Link>
          <div className="rounded-2xl border border-primary/20 bg-primary-fixed/10 p-8 text-center md:p-12">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Clock className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Ya alcanzaste tus {DAILY_LIMIT} rutinas de hoy
            </h1>
            <p className="mx-auto mt-3 max-w-md font-body-md text-body-md text-on-surface-variant">
              Cada día puedes generar hasta {DAILY_LIMIT} rutinas nuevas con nuestra IA.
              Vuelve mañana para seguir explorando combinaciones de productos para tu piel ✨
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/productos">
                <Button
                  variant="primary"
                  trailingIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Ver productos
                </Button>
              </Link>
              <Link href="/soporte">
                <Button variant="ghost">¿Dudas? Escríbenos</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Form view ── */
  return (
    <main className="min-h-screen bg-background pb-40 pt-20 md:pb-24">
      <div className="mx-auto max-w-2xl px-margin-mobile md:px-margin-desktop">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Inicio
        </Link>

        <header className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed/30 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-label-caps text-label-caps text-primary">
              Generador con IA
            </p>
            <h1 className="font-headline-md text-headline-sm text-on-surface">
              Tu Rutina K-Beauty
            </h1>
          </div>
        </header>

        <p className="mb-3 font-body-md text-body-md text-on-surface-variant">
          Responde 4 preguntas rápidas y nuestra IA te arma una rutina
          personalizada usando solo los productos de nuestra tienda.
        </p>

        {hydrated && (
          <p className="mb-6 font-body-sm text-body-sm text-on-surface-variant">
            Te quedan <strong className="text-primary">{remaining}</strong>{" "}
            {remaining === 1 ? "rutina gratis" : "rutinas gratis"} hoy (se
            reinician a las 00:00 UTC).
          </p>
        )}

        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                s.id <= step ? "bg-primary" : "bg-outline-variant/30"
              )}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm md:p-8">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <Loader2
                className="h-10 w-10 animate-spin text-primary"
                aria-hidden="true"
              />
              <p className="font-headline-sm text-headline-sm text-on-surface">
                Generando tu rutina…
              </p>
              <p className="max-w-sm font-body-sm text-body-sm text-on-surface-variant">
                La IA está revisando nuestro catálogo y eligiendo los mejores
                productos para ti. Tarda 5–15 segundos.
              </p>
            </div>
          ) : (
            <>
              <p className="font-label-caps text-label-caps text-primary">
                {STEPS[step]?.subtitle}
              </p>
              <h2 className="mt-1 font-headline-sm text-headline-sm text-on-surface">
                {STEPS[step]?.title}
              </h2>

              <div className="mt-6">
                {step === 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {SKIN_TYPES.map((s) => (
                      <OptionButton
                        key={s.key}
                        active={skinType === s.key}
                        onClick={() => setSkinType(s.key)}
                        label={s.label}
                        desc={s.desc}
                      />
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <p className="mb-3 font-body-sm text-body-sm text-on-surface-variant">
                      Selecciona todas las que apliquen (mínimo 1).
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {CONCERNS.map((c) => (
                        <li key={c.key}>
                          <GlowChip
                            active={concerns.includes(c.key)}
                            onClick={() => toggleConcern(c.key)}
                          >
                            <span className="mr-1.5">{c.emoji}</span>
                            {c.label}
                          </GlowChip>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <p className="mb-2 font-label-caps text-label-caps text-on-surface-variant">
                        Edad
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {AGE_RANGES.map((a) => (
                          <OptionButton
                            key={a.key}
                            active={ageRange === a.key}
                            onClick={() => setAgeRange(a.key)}
                            label={a.label}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 font-label-caps text-label-caps text-on-surface-variant">
                        Experiencia con K-beauty
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {EXPERIENCES.map((e) => (
                          <OptionButton
                            key={e.key}
                            active={experience === e.key}
                            onClick={() => setExperience(e.key)}
                            label={e.label}
                            desc={e.desc}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {TIME_OF_DAY.map((t) => (
                      <OptionButton
                        key={t.key}
                        active={timeOfDay === t.key}
                        onClick={() => setTimeOfDay(t.key)}
                        label={t.label}
                        desc={t.desc}
                        icon={t.icon}
                      />
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-2 rounded-md border border-error bg-error-container p-3 font-body-sm text-body-sm text-error"
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                  leadingIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Atrás
                </Button>
                {step < 3 ? (
                  <Button
                    variant="primary"
                    onClick={() => setStep(step + 1)}
                    disabled={!canAdvance()}
                    trailingIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!canAdvance() || loading}
                    loading={loading}
                    leadingIcon={<Sparkles className="h-4 w-4" />}
                  >
                    Generar mi rutina
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function OptionButton({
  active,
  onClick,
  label,
  desc,
  icon: Icon,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
  icon?: typeof Sun;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-all",
        active
          ? "border-primary bg-primary-fixed/20 shadow-glow"
          : "border-outline-variant/30 bg-surface-container-lowest hover:border-primary",
        compact && "p-2.5"
      )}
    >
      {Icon && (
        <span
          className={cn(
            "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
            active
              ? "bg-primary text-on-primary"
              : "bg-primary-fixed/30 text-primary"
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-body-md font-medium text-on-surface",
            compact ? "text-body-sm" : "text-body-md"
          )}
        >
          {label}
        </p>
        {desc && (
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            {desc}
          </p>
        )}
      </div>
      {active && (
        <Check
          className="ml-1 h-4 w-4 flex-shrink-0 text-primary"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

function RoutineSection({
  title,
  icon: Icon,
  steps,
  productBySlug,
}: {
  title: string;
  icon: typeof Sun;
  steps: RoutineStep[];
  productBySlug: Map<string, Product>;
}) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        {title}
      </h2>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => {
          const product = productBySlug.get(s.product_slug);
          return (
            <li
              key={`${s.product_slug}-${i}`}
              className="flex gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-fixed/30 font-label-caps text-label-caps text-primary">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-label-caps text-label-caps text-primary">
                    {s.step}
                  </p>
                  {product && (
                    <DualPrice
                      priceUsd={product.price_usd}
                      tasaBcv={612}
                      size="sm"
                    />
                  )}
                </div>
                {product ? (
                  <Link
                    href={`/productos/${product.slug}`}
                    className="mt-0.5 block font-body-md text-body-md font-medium text-on-surface hover:text-primary"
                  >
                    {product.brand} — {product.name}
                  </Link>
                ) : (
                  <p className="mt-0.5 font-body-md text-body-md text-on-surface">
                    {s.product_slug}
                  </p>
                )}
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {s.reason}
                </p>
                {product && (
                  <Link
                    href={`/productos/${product.slug}`}
                    className="mt-2 inline-flex items-center gap-1 font-label-caps text-label-caps text-primary hover:underline"
                  >
                    Ver producto
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
              {product && (
                <Link
                  href={`/productos/${product.slug}`}
                  className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-surface-container-low"
                  aria-label={`Ver ${product.name}`}
                >
                  <Image
                    src={product.images?.[0] ?? "/images/placeholder.png"}
                    alt={product.name}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
