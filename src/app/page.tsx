"use client";

import {OfferBlock} from "@/components/OfferBlock";
import {Tarot} from "@/components/Tarot";
import {Modal} from "@/components/Modal";
import {LoginForm} from "@/components/LoginForm";
import {UserProfile} from "@/components/UserProfile";
import {SubscriptionPlans} from "@/components/SubscriptionPlans";
import {Loader} from "@/components/Loader";
import {useEffect, useState} from "react";
import {Header} from "@/components/Header";
import {Providers} from "@/components/Providers";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <Providers>
        {!isLoaded
            ? <Loader />
            : (
                <>
                  <Header onOpenLogin={() => setIsLoginOpen(true)} onOpenProfile={() => setIsProfileOpen(true)}/>
                  <main className="">
                    <OfferBlock
                        onOpenLogin={() => setIsLoginOpen(true)}
                        onOpenSubscription={() => setIsSubscriptionOpen(true)}
                    />
                    <Tarot/>
                  </main>
                  <Modal
                    title="Step Through the Veil"
                    isOpen={isLoginOpen}
                    onClose={() => setIsLoginOpen(false)}
                  >
                    <LoginForm onSuccess={() => setIsLoginOpen(false)} />
                  </Modal>
                  <Modal
                    title="Your Mystic Profile"
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                  >
                    <UserProfile onClose={() => setIsProfileOpen(false)} />
                  </Modal>
                  <Modal
                    title="Choose Your Path"
                    isOpen={isSubscriptionOpen}
                    onClose={() => setIsSubscriptionOpen(false)}
                    wide
                  >
                    <SubscriptionPlans showHeader={false} />
                  </Modal>
                </>
            )
        }
    </Providers>
  );
};
