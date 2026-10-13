import { getSiteSettings } from '../../../actions/site-settings.ts';

export async function handleGetSiteSettings() {
  try {
    return { status: 200, body: { success: true, settings: await getSiteSettings() } };
  } catch (error) {
    console.error('[SiteSettings] Could not load public settings:', error);
    return { status: 500, body: { success: false, error: 'Could not load site settings.', settings: {} } };
  }
}
