# Photo identifier

A user uploads a photo of a truffle (فقع). Llama Vision names the type (زبيدي، خلاسي، جبي، هبر), gives a confidence, quality, freshness, an estimated price per kg in SAR, tips, and warnings. Invalid model output gets one retry with feedback.

## Sub-features

- `identify-ok`: a valid PNG/JPG/WEBP data URL returns a typed result.
- `identify-forward`: the user's photo and note reach Llama unchanged, with the server secret.
- `identify-retry`: invalid model JSON triggers exactly one retry carrying the validation errors.
- `identify-evidence`: the truffle-or-potato call is made in code from the model's reported signs (eyes or sprouts, purple, lumpy and matte), not from its `isTruffle`.
- `identify-quota`: when Workers AI's daily free allocation is used up, the API returns 503 `llama_quota` with the reset time, and stops calling upstream until 00:00 UTC.
- `identify-validate`: an unsupported format or empty image returns 400 without calling Llama.

## How to get to it (user POV)

- A client posts `{ "image": "data:image/png;base64,...", "note": "..." }` to `/api/identify`.

## Driving it with verify-faqqa

Preconditions:

- Baseline preconditions from README.md.

- **Identify.** Upload a 1×1 PNG with a note. Run `$V drive identify`. Expect 200, `attempts` 1, `type` `زبيدي`, price 300–600, one stub call with `Bearer verify-faqqa-secret`, the vision model ID, and `photoForwarded` true.
- **Retry.** Send the note `STUB_BAD_FIRST`. Run `$V drive identify-retry`. Expect 200, `attempts` 2, and two stub calls, the second with `retryFeedback` true.
- **Evidence.** Send the notes `STUB_SAYS_POTATO` and `STUB_REAL_POTATO`. Run `$V drive identify-evidence`. Expect the first overruled to `زبيدي` (price 250–700, confidence 55–70, no warnings) and the second to `ليس فقعاً` with no price.
- **Bad image.** Send a GIF, then an empty image. Run `$V drive identify-validation`. Expect 400 with `صيغة الصورة غير مدعومة (PNG أو JPG أو WEBP)` and `ارفع صورة أول`, and `llamaNotCalled` true.

## Gotchas

- Live vision calls are expensive. Workers AI's free plan gives 10,000 neurons a day, and about 20 photo checks in one session used them all up, which took the live site's model offline until 00:00 UTC. Test against the stub. Use the real model sparingly, with at most a handful of photos.
- `identify-quota` is not driven, because the breaker would block every later drive in the same server. It was proven once against the real exhausted proxy: the first call took 0.5 s and the second 0.02 s, both returning `llama_quota`.

- The stub wraps its JSON in prose and code fences on purpose, so `coerceJson` is exercised.
- Images over 4 MB (string length) are rejected with `الصورة كبيرة. جرب صورة أصغر`. This is not driven.
- A 200 with a good-looking body is not proof. The break run dropped the photo and still returned 200, and only `photoForwarded` caught it.
