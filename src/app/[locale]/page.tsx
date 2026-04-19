import { unstable_setRequestLocale } from "next-intl/server";
import { HomePageClient } from "./HomePageClient";

type Props = {
  params: { locale: string };
};

export default function Home({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return <HomePageClient />;
}
