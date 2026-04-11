import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {useMessages} from "next-intl";
import {Card} from "@/types/Types";
import {tarots} from "@/data";
import {generateReading} from "@/lib/generateReading";

type AppState = {
    tarots: Card[];
    chosenCards: Card[];
    resetFlipped: boolean;
    isPredictionReady: boolean;
    response: string;
    isResponseLoading: boolean;
    isCardsModalOpen: boolean;
    shakeCount: number;
};

type AppContextType = {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
};

const defaultState: AppContextType = {
    state: {
        tarots: tarots,
        chosenCards: [],
        resetFlipped: false,
        isPredictionReady: false,
        response: '',
        isResponseLoading: false,
        isCardsModalOpen: false,
        shakeCount: 0,
    },
    setState: () => {},
};

const AppContext = createContext<AppContextType>(defaultState);

type AppProviderProps = {
    children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
    const [state, setState] = useState<AppState>(defaultState.state);
    const messages = useMessages();

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
            );
            setState(prevState => ({
                ...prevState,
                isResponseLoading: false,
                response: response,
            }));
        }
    }, [state.chosenCards, messages]);

    return (
        <AppContext.Provider value={{ state, setState }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}
