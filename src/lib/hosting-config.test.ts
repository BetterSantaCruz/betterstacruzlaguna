import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type VercelConfig = {
  $schema?: string;
  rewrites?: Array<{
    destination: string;
    source: string;
  }>;
};

const vercelConfigPath = resolve(process.cwd(), 'vercel.json');

describe('Vercel SPA hosting contract', () => {
  it('routes BrowserRouter deep links to the built entry document', () => {
    const config = JSON.parse(
      readFileSync(vercelConfigPath, 'utf8')
    ) as VercelConfig;

    expect(config).toMatchObject({
      $schema: 'https://openapi.vercel.sh/vercel.json',
      rewrites: [{ source: '/(.*)', destination: '/index.html' }],
    });
  });
});
