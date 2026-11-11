import type { Preview } from "@storybook/react-vite";
import "./preview.css";
import { PeerbotsI18nProvider } from "@peerbots/core";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
    },
  },
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Internationalization locale",
      defaultValue: "en",
      toolbar: {
        icon: "globe",
        items: [
          { value: "en", right: "🇺🇸", title: "English" },
          { value: "ar", right: "🇪🇬", title: "Arabic (RTL)" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const { locale } = context.globals;
      const isArabic = locale === "ar";
      return (
        <PeerbotsI18nProvider dir={isArabic ? "rtl" : "ltr"} lang={locale}>
          <Story />
        </PeerbotsI18nProvider>
      );
    },
  ],
};

export default preview;
