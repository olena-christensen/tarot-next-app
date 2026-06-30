import React, {createContext, ReactNode, useContext, useEffect, useMemo, useState} from 'react';
import {useSession} from "next-auth/react";
import {Card} from "@/types/Types";
import {tarots} from "@/data";
import {getCardImagePath, DEFAULT_DECK} from "@/lib/decks";
import {DEFAULT_READER, isReaderId, type ReaderId} from "@/lib/readers";

type AppState = {
    tarots: Card[];
    chosenCards: Card[];
    resetFlipped: boolean;
    isPredictionReady: boolean;
    response: string;
    isResponseLoading: boolean;
    isCardsModalOpen: boolean;
    /** Reader voice used for generateReading. Always set, defaults to DEFAULT_READER. */
    selectedReader: ReaderId;
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
        selectedReader: DEFAULT_READER,
    },
    setState: () => {},
});

type AppProviderProps = {
    children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
    const { data: session } = useSession();
    const deck = session?.user?.preferredDeck ?? DEFAULT_DECK;
    const sessionReader = session?.user?.preferredReader;
    const reader: ReaderId = isReaderId(sessionReader) ? sessionReader : DEFAULT_READER;

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
        selectedReader: reader,
    });

    // Update tarots when deck changes
    useEffect(() => {
        setState(prev => ({ ...prev, tarots: resolvedTarots }));
    }, [resolvedTarots]);

    // Update reader when session preference changes
    useEffect(() => {
        setState(prev => ({ ...prev, selectedReader: reader }));
    }, [reader]);

    return (
        <AppContext.Provider value={{ state, setState }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}
