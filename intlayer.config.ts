import { Locales, type IntlayerConfig } from "intlayer";

const config: IntlayerConfig = {
  internationalization: {
    locales: [Locales.PORTUGUESE, Locales.ENGLISH],
    defaultLocale: Locales.PORTUGUESE,
  },
};

export default config;
