import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputField, SelectField } from "@/components/ui/field";
import { InfoCard } from "@/components/ui/info-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Surface } from "@/components/ui/surface";

export default function DesignSystemPage() {
  return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <Surface as="section" variant="panelStrong" className="hero-shell relative overflow-hidden rounded-[2.75rem] p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="section-eyebrow">Design System</p>
              <h1 className="mt-2 text-4xl font-semibold leading-[0.96] text-slate-950 dark:text-white md:text-6xl">
                Tokens, primitives, and patterns used by this app
              </h1>
              <p className="muted-copy mt-4 text-base md:text-lg">
                This page is the reference surface for keeping future apps visually consistent without copying full screens.
              </p>
            </div>
            <Link href="/" className="brand-btn-secondary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition">
              Back to app
            </Link>
          </div>
        </Surface>

        <Surface as="section" variant="panel" className="rounded-[2.2rem] p-5 md:p-6">
          <SectionHeader
            eyebrow="Tokens"
            title="Brand and semantic colors"
            description="These variables are defined in src/app/tokens.css and should stay as the single source of truth."
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard title="Brand Accent" description="var(--brand-accent)">
              <div className="mt-3 h-12 rounded-2xl" style={{ backgroundColor: "var(--brand-accent)" }} />
            </InfoCard>
            <InfoCard title="Brand Ink" description="var(--brand-ink)">
              <div className="mt-3 h-12 rounded-2xl" style={{ backgroundColor: "var(--brand-blue)" }} />
            </InfoCard>
            <InfoCard title="Panel Border" description="var(--panel-border)">
              <div className="mt-3 h-12 rounded-2xl border" style={{ borderColor: "var(--panel-border)", backgroundColor: "var(--panel-strong)" }} />
            </InfoCard>
            <InfoCard title="Page Gradient" description="var(--page-bg)">
              <div className="mt-3 h-12 rounded-2xl" style={{ background: "var(--page-bg)" }} />
            </InfoCard>
          </div>
        </Surface>

        <Surface as="section" variant="panel" className="rounded-[2.2rem] p-5 md:p-6">
          <SectionHeader eyebrow="Primitives" title="Core building blocks" description="These are the lowest-level reusable UI pieces." />
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <InfoCard title="Buttons" description="Primary, secondary, and danger actions">
              <div className="mt-3 flex flex-wrap gap-3">
                <Button>Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="danger">Danger Action</Button>
              </div>
            </InfoCard>
            <InfoCard title="Badges" description="Compact labels and status chips">
              <div className="mt-3 flex flex-wrap gap-3">
                <Badge>Uploads</Badge>
                <Badge>Coverage</Badge>
                <Badge>Admin</Badge>
              </div>
            </InfoCard>
            <InfoCard title="Fields" description="Shared text and select controls">
              <div className="mt-3 grid gap-3">
                <InputField value="Client Name" readOnly className="rounded-2xl px-4 py-3 text-sm" />
                <SelectField value="All Regions" disabled className="text-sm">
                  <option>All Regions</option>
                </SelectField>
              </div>
            </InfoCard>
            <InfoCard title="Surfaces" description="Panel layers used across the app">
              <div className="mt-3 grid gap-3">
                <Surface variant="panel" className="rounded-2xl p-4 text-sm">Panel</Surface>
                <Surface variant="panelSoft" className="rounded-2xl p-4 text-sm">Soft panel</Surface>
                <Surface variant="brand" className="rounded-2xl p-4 text-sm">Brand surface</Surface>
              </div>
            </InfoCard>
          </div>
        </Surface>

        <Surface as="section" variant="panel" className="rounded-[2.2rem] p-5 md:p-6">
          <SectionHeader eyebrow="Patterns" title="Reusable layout patterns" description="Patterns compose primitives into consistent app sections." />
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <Surface variant="panelSoft" className="rounded-[1.9rem] p-5">
              <SectionHeader
                eyebrow="Section Header"
                title="Upload status"
                description="Use for panel headings with optional actions on the right."
                meta={<Button variant="secondary" size="sm">Action</Button>}
              />
            </Surface>
            <InfoCard title="Info Card" description="Dataset summary">
              Active file with validation summary and supplemental content.
            </InfoCard>
          </div>
        </Surface>
      </div>
    </main>
  );
}
