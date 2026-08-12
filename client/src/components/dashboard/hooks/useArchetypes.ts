import { useState } from "react";

import type { Archetype } from "../types";
import { ARCHETYPES } from "../archetypes";

export function useArchetypes() {
  const [archetypes, setArchetypes] = useState<Archetype[]>(ARCHETYPES);

  const updateArchetypePrompt = (archetypeId: number, prompt: string) => {
    const normalizedPrompt = prompt.trim();
    if (!normalizedPrompt) {
      return;
    }

    setArchetypes((current) =>
      current.map((item, index) => {
        const itemId = item.id || index + 1;
        if (itemId !== archetypeId) {
          return item;
        }
        return {
          ...item,
          prompt: normalizedPrompt,
        };
      })
    );
  };

  return {
    archetypes,
    updateArchetypePrompt,
  };
}
