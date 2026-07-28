import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false, // Dev ရော Prod မှာပါ PWA / SW အလုပ်လုပ်စေရန်
  cacheOnFrontEndNav: true, // Offline ခချိန် Navigations စာမျက်နှာများ Cache မိစေရန်
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    importScripts: ['/sw-custom.js'], // Custom Background Sync listener
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
};

export default withPWA(nextConfig);