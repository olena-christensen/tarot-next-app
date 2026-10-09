/**
 * The Veil's Facebook app (created by Lena 2026-10-10). Not a secret: it ends up
 * in every page that uses it. Needed for Facebook's "send to a person" window
 * (Messenger) and for the fb:app_id tag that link previews look for.
 */
export const FACEBOOK_APP_ID = "1644617653854692";

/** Send a link to one person in Messenger: the app on phones, Facebook's send window on computers. */
export function messengerSendUrl(url: string, touch: boolean): string {
  const link = encodeURIComponent(url);
  return touch
    ? `fb-messenger://share/?link=${link}&app_id=${FACEBOOK_APP_ID}`
    : `https://www.facebook.com/dialog/send?app_id=${FACEBOOK_APP_ID}&link=${link}&redirect_uri=${link}&display=popup`;
}
