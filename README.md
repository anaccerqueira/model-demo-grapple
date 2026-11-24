# Model Demo Grapple

Add the attached demo.html to the public folder exactly as it is, and make the home page redirect to /demo.html. Create a Supabase Edge Function called “llm” with the attached index.ts code, and set verify_jwt to false for it. Add a secret ANTHROPIC_API_KEY. Then replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY in demo.html with this project’s values. Do not change anything else in the page.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://model-demo-grapple.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f33d2290-912b-4268-b97e-a1905ab2a525).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
