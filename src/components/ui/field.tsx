import { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type InputProps = ComponentPropsWithoutRef<"input">;
type SelectProps = ComponentPropsWithoutRef<"select">;

export function InputField({ className, ...props }: InputProps) {
  return <input className={cn("brand-input w-full rounded-[1.6rem] px-5 py-3.5 text-base", className)} {...props} />;
}

export function SelectField({ className, children, ...props }: SelectProps) {
  return (
    <select className={cn("field-shell w-full rounded-2xl px-4 py-3 text-slate-900 dark:text-slate-100", className)} {...props}>
      {children}
    </select>
  );
}
