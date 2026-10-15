import LoaderSvg from "../assets/svg/ouroboros.svg";

/**
 * Full-screen dark loader. `top` lays it over open dialogs too; `leaving`
 * fades it out (the first-load veil in SiteChrome).
 */
export const Loader = ({ top = false, leaving = false }: { top?: boolean; leaving?: boolean }) => {
    return (
        <div
            className={`loader${top ? " loader--top" : ""}${leaving ? " loader--leaving" : ""}`}
            role="status"
            aria-busy={!leaving}
        >
            <LoaderSvg />
        </div>
    );
};
