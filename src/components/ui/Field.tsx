import { clsx } from "clsx";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:bg-slate-50 disabled:text-slate-400";

export function FieldWrapper({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function TextInput({
  className,
  ref,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} className={clsx(inputClass, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(inputClass, className)} rows={3} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(inputClass, "bg-white", className)} {...props}>
      {children}
    </select>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "accent";
}) {
  return (
    <button
      className={clsx(
        "rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        variant === "primary" && "bg-brand-800 text-white hover:bg-brand-900 hover:shadow-md",
        variant === "secondary" &&
          "border border-slate-300 text-slate-700 hover:border-brand-300 hover:bg-slate-100",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700 hover:shadow-md",
        variant === "accent" && "bg-gold-500 text-brand-900 hover:bg-gold-600 hover:shadow-md",
        className
      )}
      {...props}
    />
  );
}
