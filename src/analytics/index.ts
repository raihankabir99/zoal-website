import { initializeMetricool } from './Metricool';
import { initializeMetaPixel } from './MetaPixel';
import { initializeGoogleAnalytics } from './GoogleAnalytics';
import { initializeTikTokPixel } from './TikTokPixel';
import { initializeClarity } from './Clarity';
import { initializeGoogleTagManager } from './GoogleTagManager';

export {
  initializeMetricool,
  initializeMetaPixel,
  initializeGoogleAnalytics,
  initializeTikTokPixel,
  initializeClarity,
  initializeGoogleTagManager
};

export function initializeAnalytics(): void {
  initializeMetricool();
  initializeMetaPixel();
  initializeGoogleAnalytics();
  initializeTikTokPixel();
  initializeClarity();
  void initializeGoogleTagManager();
}
