/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
import createNextIntlPlugin from 'next-intl/plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });
        return config;
    },
    sassOptions: {
        includePaths: [path.join(__dirname, 'styles')],
    },
    env: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
    experimental: {
        // The OG image reads the Raleway file off disk at request time. Next's
        // tracer can't see a runtime `readFile(join(process.cwd(), ...))`, so on
        // Vercel the file is absent from the function bundle and the route 500s.
        // Card art is NOT listed here on purpose — public/Cards is 76MB; the
        // route fetches those from the CDN instead.
        outputFileTracingIncludes: {
            '/[locale]/r/[shareId]/opengraph-image': ['./assets/fonts/**'],
        },
    },
};

export default withNextIntl(nextConfig);
