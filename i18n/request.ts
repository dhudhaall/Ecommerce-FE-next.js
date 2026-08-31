import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  // const requestedLocale = await requestLocale;

  // console.log("requestedLocale:", requestedLocale);

  // const locale =
  //   requestedLocale &&
  //   routing.locales.includes(
  //     requestedLocale as (typeof routing.locales)[number]
  //   )
  //     ? requestedLocale
  //     : routing.defaultLocale;

  // console.log("resolved locale:", locale);

  return {
    locale:'en',
    messages: (await import(`../messages/en.json`)).default,
  };
});