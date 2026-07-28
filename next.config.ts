import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development" ? false : false,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    // 💡 Custom ရေးထားသော background sync code အား လှမ်းပေါင်းထည့်ခိုင်းခြင်း
    importScripts: ['/sw-custom.js'], 
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
};

export default withPWA(nextConfig);