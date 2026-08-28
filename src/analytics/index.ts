import { initializeMetricool } from './Metricool';
import { initializeMetaPixel } from './MetaPixel';
import { initializeGoogleAnalytics } from './GoogleAnalytics';
import { initializeTikTokPixel } from './TikTokPixel';
import { initializeClarity } from './Clarity';

export {
  initializeMetricool,
  initializeMetaPixel,
  initializeGoogleAnalytics,
  initializeTikTokPixel,
  initializeClarity
};

export function initializeAnalytics(): void {
  // Initialize Metricool
  initializeMetricool();

  // Future-ready platforms (initialized dynamically if configuration IDs are provided)
  initializeMetaPixel();
  initializeGoogleAnalytics();
  initializeTikTokPixel();
  initializeClarity();
}
