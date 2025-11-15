import withPWA from 'next-pwa';

const isProd = process.env.NODE_ENV === 'production';

const pwa = withPWA({
  dest: 'public',
  disable: !isProd,
  register: false,
  skipWaiting: true
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  }
};

export default pwa(nextConfig);
