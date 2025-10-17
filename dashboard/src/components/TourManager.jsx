/**
 * TourManager.jsx — 5G Energy Optimization Dashboard
 * ==================================================
 *
 * Purpose:
 * --------
 * Provides a reusable configuration and initialization logic
 * for all interactive user tours across the platform.
 *
 * Features:
 * ----------
 * - Centralized `driver.js` setup with consistent UI theme and animation.
 * - Standardized Turkish button labels for better UX.
 * - Enables smooth scrolling, progress tracking, and overlay opacity control.
 *
 * Technical Notes:
 * ----------------
 * - Library: driver.js
 * - Exported Function: startTour(steps)
 * - Config Object: driverConfig (global reusable setup)
 */


import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const driverConfig = {
  showProgress: true,
  allowClose: true,
  nextBtnText: "İleri",
  prevBtnText: "Geri",
  doneBtnText: "Tamamla",
  stagePadding: 4,
  animate: true,
  overlayOpacity: 0.6,
  smoothScroll: true,
  popoverClass: "custom-tour-popover",
};

export function startTour(steps) {
  const tour = driver({
    ...driverConfig,
    steps,
  });
  tour.drive();
}
