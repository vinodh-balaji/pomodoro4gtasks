export const dynamic = 'force-static';

export async function GET() {
  return new Response('google-site-verification: google02f0f81938e4636f.html', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
