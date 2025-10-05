import { ReactNode } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProductSectionProps {
  value: string;
  title: string;
  children: ReactNode;
}

export function ProductSection({
  value,
  title,
  children,
}: ProductSectionProps) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
