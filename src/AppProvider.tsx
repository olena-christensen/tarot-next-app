import React, {createContext, ReactNode, useContext, useEffect, useMemo, useState} from 'react';
import {useMessages} from "next-intl";
import {useSession} from "next-auth/react";
import {Card} from "@/types/Types";
import {tarots} from "@/data";
import {generateReading} from "@/lib/generateReading";
import {getCardImagePath, DEFAULT_DECK} from "@/lib/decks";
import {DEFAULT_READER, type ReaderId} from "@/lib/readers";

type AppState = {
    tarots: Card[];
    chosenCards: Card[];
    resetFlipped: boolean;
    isPredictionReady: boolean;
    response: string;
    isResponseLoading: boolean;
    isCardsModalOpen: boolean;
    shakeCount: number;
    /**
     * Reader chosen for the current reading session.
     * - null = the user hasn't picked yet (Tarot.tsx will show the selection screen)
     * - any ReaderId = use that reader's voice in generateReading
     *
     * Tarot.tsx is responsible for setting this back to null when the modal
     * closes (for logged-in users), and Tarot.tsx also decides whether to
     * even show the selection step (anonymous users + locales without
     * translated readers skip it).
     */
    selectedReader: ReaderId | null;
};

type AppContextType = {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
};

const AppContext = createContext<AppContextType>({
    state: {
        tarots: [],
        chosenCards: [],
        resetFlipped: false,
        isPredictionReady: false,
        response: '',
        isResponseLoading: false,
        isCardsModalOpen: false,
        shakeCount: 0,
        selectedReader: null,
    },
    setState: () => {},
});

type AppProviderProps = {
    children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
    const { data: session } = useSession();
    const deck = session?.user?.preferredDeck ?? DEFAULT_DECK;

    const resolvedTarots = useMemo(() =>
        tarots.map(card => ({
            ...card,
            image: getCardImagePath(deck, card.image),
        })),
        [deck]
    );

    const [state, setState] = useState<AppState>({
        tarots: resolvedTarots,
        chosenCards: [],
        resetFlipped: false,
        isPredictionReady: false,
        response: '',
        isResponseLoading: false,
        isCardsModalOpen: false,
        shakeCount: 0,
        selectedReader: null,
    });

    const messages = useMessages();

    // Update tarots when deck changes
    useEffect(() => {
        setState(prev => ({ ...prev, tarots: resolvedTarots }));
    }, [resolvedTarots]);

    useEffect(() => {
        if (state.chosenCards.length > 0) {
            setState(prevState => ({
                ...prevState,
                resetFlipped: true,
                isPredictionReady: false,
                isResponseLoading: true,
            }));

            const response = generateReading(
                state.chosenCards,
                messages as any,
                (messages as any).ui?.drawThreeCards ?? "Draw three cards to receive your reading.",
                (messages as any).ui?.spiritsUnclear ?? "The spirits are unclear. Please draw again.",
                state.selectedReader ?? DEFAULT_READER,
            );
            setState(prevState => ({
                ...prevState,
                isResponseLoading: false,
                response: response,
            }));
        }
    }, [state.chosenCards, messages, state.selectedReader]);

    return (
        <AppContext.Provider value={{ state, setState }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}
