import Medallion1 from "../assets/svg/medallion1.svg";
import Medallion2 from "../assets/svg/medallion2.svg";
import Medallion3 from "../assets/svg/medallion3.svg";
import Medallion4 from "../assets/svg/medallion4.svg";
import Medallion5 from "../assets/svg/medallion5.svg";
import Medallion6 from "../assets/svg/medallion6.svg";

/**
 * Decorative medallion backdrop — the same six SVGs the home page's offer-block
 * uses, extracted so any page can share the look. Renders as a fixed, full-bleed
 * layer behind the content (pointer-events: none, so it never intercepts clicks).
 * Purely presentational; consumers just drop <MysticBackground /> into the page.
 */
export const MysticBackground = () => (
  <div className="mystic-bg" aria-hidden="true">
    <div className="mystic-bg__row">
      <Medallion1 />
      <Medallion2 />
    </div>
    <div className="mystic-bg__row">
      <Medallion3 />
      <Medallion4 />
    </div>
    <div className="mystic-bg__row">
      <Medallion5 />
      <Medallion6 />
    </div>
  </div>
);
