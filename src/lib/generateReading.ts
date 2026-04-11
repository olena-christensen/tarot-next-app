type ReadingMessages = {
  readings: Record<string, {
    past: string;
    present: string;
    future: string;
  }>;
  readingTemplates: {
    intros: string[];
    bridges: string[];
    futureBridges: string[];
    closings: string[];
    pastPrefix: string;
    presentPrefix: string;
    futurePrefix: string;
  };
  cards: Record<string, string>;
};

export function generateReading(
  cardIds: { id: string }[],
  messages: ReadingMessages,
  fallbackError: string,
  fallbackUnclear: string,
): string {
  if (cardIds.length !== 3) return fallbackError;

  const [c1, c2, c3] = cardIds;
  const r1 = messages.readings[c1.id];
  const r2 = messages.readings[c2.id];
  const r3 = messages.readings[c3.id];

  if (!r1 || !r2 || !r3) return fallbackUnclear;

  const card1Name = messages.cards[c1.id];
  const card2Name = messages.cards[c2.id];
  const card3Name = messages.cards[c3.id];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const intro = pick(messages.readingTemplates.intros)
    .replace("{card1}", card1Name)
    .replace("{card2}", card2Name)
    .replace("{card3}", card3Name);

  const bridge = pick(messages.readingTemplates.bridges);
  const futureBridge = pick(messages.readingTemplates.futureBridges);
  const closing = pick(messages.readingTemplates.closings);

  const pastPrefix = messages.readingTemplates.pastPrefix.replace("{card}", card1Name);
  const presentPrefix = messages.readingTemplates.presentPrefix.replace("{card}", card2Name);
  const futurePrefix = messages.readingTemplates.futurePrefix.replace("{card}", card3Name);

  return [
    intro,
    "",
    `${pastPrefix}${r1.past}`,
    "",
    bridge,
    "",
    `${presentPrefix}${r2.present}`,
    "",
    futureBridge,
    "",
    `${futurePrefix}${r3.future}`,
    "",
    closing,
  ].join("\n");
}
