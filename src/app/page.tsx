"use client";

import {OfferBlock} from "@/components/OfferBlock";
import {Tarot} from "@/components/Tarot";
import {LoginModal} from "@/components/LoginModal";
import {Loader} from "@/components/Loader";
import {useEffect, useRef, useState} from "react";
import {Header} from "@/components/Header";
import {Providers} from "@/components/Providers";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const tarotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);

  }, []);

  const scrollToTarot = () => {
    if (tarotRef.current) {
      tarotRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Providers>
        {!isLoaded
            ? <Loader />
            : (
                <>
                  <Header onOpenLogin={() => setIsLoginOpen(true)}/>
                  <main className="">
                    <OfferBlock
                        onScrollToTarot={scrollToTarot}
                        onOpenLogin={() => setIsLoginOpen(true)}
                    />
                    <div ref={tarotRef}>
                      <Tarot/>
                    </div>
                  </main>
                  <LoginModal
                    isOpen={isLoginOpen}
                    onClose={() => setIsLoginOpen(false)}
                  />
                </>
            )
        }
    </Providers>
  );
};
