import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";

const options: { id: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "light", label: "Light", Icon: Sun },
  { id: "system", label: "System", Icon: Monitor },
];

export function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const current = options.find((item) => item.id === theme) ?? options[0];
  const Icon = current.id === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="theme-switch-trigger" aria-label={`Colour theme: ${current.label}. Change appearance.`} title={`Theme: ${current.label}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={`${current.id}-${resolvedTheme}`} className="theme-switch-icon" initial={reduceMotion ? false : { opacity: 0, rotate: -14, scale: 0.88 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, rotate: 14, scale: 0.92 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
            <Icon size={16} aria-hidden="true" />
          </motion.span>
        </AnimatePresence>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="theme-menu" aria-label="Theme preference">
      <DropdownMenuLabel>Appearance</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as ThemePreference, document.querySelector<HTMLButtonElement>(".theme-switch-trigger"))}>
        {options.map(({ id, label, Icon: OptionIcon }) => <DropdownMenuRadioItem key={id} value={id}>
          <OptionIcon size={15} aria-hidden="true" />{label}
        </DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <p className="theme-menu-hint">System follows this device’s appearance.</p>
    </DropdownMenuContent>
  </DropdownMenu>;
}
