# CRUSH CODE ♡

**Love is complicated. Let's decode it.**

A responsive, premium editorial love and dating website with six interactive features, built with Next.js and the OpenAI Chat Completions API. The website and all AI responses are in English.

## Features

1. **Love Calculator** — deterministic 0–100% entertainment-only score, five subcategories, real AI commentary.
2. **Red Flag Detector** — structured AI assessment with green/mixed/red verdict and practical advice.
3. **Zodiac Love Match** — playful five-part AI zodiac compatibility report.
4. **Text Decoder** — three plausible interpretations and sweet/flirty/bold replies with copy buttons.
5. **Love Guru** — multi-turn GPT-4o mini conversation, selectable personality modes, a real temperature slider (0.0–2.0), and Reality vs. Delulu simultaneous AI comparisons at 0.2 and 1.7.
6. **Love Letter Generator** — customized AI letter presented on vintage digital stationery, with copy action.

All server calls are explicitly pinned to `gpt-4o-mini`. Responses are not fabricated on the client. The model may make mistakes; red-flag advice is not a substitute for qualified support.

## Deploy without installing software (GitHub + Vercel)

1. Create a **private** repository at https://github.com/new named `crush-code`.
2. Upload the **project files and folders themselves** into the repository using **Add file → Upload files** (not the outer ZIP file). Commit them. Alternatively, add files manually using **Add file → Create new file** and their relative paths.
3. Visit https://vercel.com/new, connect GitHub and select the `crush-code` repository. Vercel automatically detects **Next.js**.
4. In **Vercel → Project → Settings → Environment Variables**, create a variable named exactly `OPENAI_API_KEY` and paste your API key as the value. Select Production, Preview and Development as appropriate. **Never put your key in website code, public GitHub files, or NEXT_PUBLIC_ variables.**
5. Deploy (or redeploy after setting the key), and open your Vercel URL.
6. Confirm all features, especially Love Guru slider, with test prompts. Live AI replies require active API billing/credits; ChatGPT subscription billing is separate.

**Important:** OpenAI secret keys commonly begin `sk-`. Never share the full key with anybody or paste it into chat. If a secret is exposed, revoke and replace it.

## Development (optional)

```sh
npm install
cp .env.example .env.local
# fill in OPENAI_API_KEY in .env.local
npm run dev
```

Open http://localhost:3000.

## API & costs

- Server route: `app/api/love/route.js`.
- Model: **`gpt-4o-mini`** only, with Chat Completions and temperature forwarded as an actual parameter.
- For costs: conservative `max_tokens`, a maximum of 8 prior messages per chat, 18-second upstream timeout, no extra calls just for display changes; comparison intentionally makes **two** requests.
- Request input length and history length are limited server-side.
- Basic rate limit: **12 requests per minute per IP per running server instance**. **Serverless hosting may create multiple instances**, so this is a best-effort limitation, *not a reliable global production spending cap*. For a public/high-traffic launch, replace it with a persistent rate limiter such as Upstash Redis or Vercel KV and add bot prevention and spending alerts/limits in OpenAI billing.
- Chat history is kept in the current browser tab's React state; it is not stored on the server or retained after page refresh.
- Input to the model is sent to OpenAI as part of the API request. Do not paste other people's sensitive personal data.
- `OPENAI_API_KEY` is read **only on the server**; `.env*` files are ignored by Git, except safe `.env.example`.

## Files

- `app/page.jsx` — complete interactive front end.
- `app/globals.css` — custom editorial responsive design.
- `app/api/love/route.js` — API integration, input validation and rate guard.
- `app/layout.jsx` — metadata and Google Fonts.
- `package.json` — dependencies and scripts.

## Limitations

The project must be deployed with a valid OpenAI key for live AI results. A public deployment also needs durable shared rate limiting to securely enforce traffic limits across serverless instances. Name/zodiac scores are deterministic entertainment values, not evidence of real compatibility. No persistent chat account or database is included.
