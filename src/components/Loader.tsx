import LoaderSvg from "../assets/svg/ouroboros.svg";

/** Full-screen dark loader. `top` lays it over open dialogs too. */
export const Loader = ({ top = false }: { top?: boolean }) => {
    return (
        <div className={`loader${top ? " loader--top" : ""}`} role="status" aria-busy="true">
            <LoaderSvg />
        </div>
    );
};
