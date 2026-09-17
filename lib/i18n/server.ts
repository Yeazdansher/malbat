import { getLocale } from "@/lib/i18n/get-locale";
import { getMessages, translate } from "@/lib/i18n/get-messages";

export async function getTranslator(namespace?: string) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    key: string,
    values?: Record<string, string | number>
  ): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return translate(messages, fullKey, values);
  };
}
