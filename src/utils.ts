import {Card} from "@/types/Types";

export const pickRandomCards = ({cards, count}: {cards: Card[]; count: number}) => {
    let chosenCards: Card[] = [];
    for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * cards.length);
        const card = cards[index];
        chosenCards = [...chosenCards, card];
        cards = cards.filter((_, i) => i !== index);
    }
    return chosenCards;
}

