import { getRequestConfig } from 'next-intl/server';
import th from '../../messages/th.json';

export default getRequestConfig(async () => ({
  locale: 'th',
  messages: th,
}));
