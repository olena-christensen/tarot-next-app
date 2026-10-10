// English messages for the standalone legal pages (privacy, terms, cookie
// policy, refund). Those routes live outside [locale], so they cannot use the
// request config. Keep this list identical to the one in ./request.ts —
// a missing file here shows up as MISSING_MESSAGE errors in the shared
// header, menu and footer.
import ui from "../../messages/en/ui.json";
import cards from "../../messages/en/cards.json";
import readings from "../../messages/en/readings.json";
import plans from "../../messages/en/plans.json";
import seo from "../../messages/en/seo.json";
import contact from "../../messages/en/contact.json";
import disclaimers from "../../messages/en/disclaimers.json";
import payment from "../../messages/en/payment.json";
import greetings from "../../messages/en/greetings.json";
import history from "../../messages/en/history.json";
import cardMeanings from "../../messages/en/cardMeanings.json";
import game from "../../messages/en/game.json";
import castle from "../../messages/en/castle.json";
import homeAbout from "../../messages/en/homeAbout.json";

export const englishMessages = {
  ...ui,
  ...cards,
  ...readings,
  ...plans,
  ...seo,
  ...contact,
  ...disclaimers,
  ...payment,
  ...greetings,
  ...history,
  ...cardMeanings,
  ...game,
  ...castle,
  ...homeAbout,
};
