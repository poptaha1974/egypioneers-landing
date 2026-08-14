export const STORE_URL = "https://egy-pioneers.swqly.net/home";

export function isEgyPioneersStoreUrl(value: string) {
  const url = new URL(value);

  return (
    url.protocol === "https:" &&
    url.hostname === "egy-pioneers.swqly.net" &&
    url.pathname === "/home"
  );
}
