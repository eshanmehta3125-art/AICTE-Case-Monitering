# Third-party notices

## Magic UI component patterns

The local number ticker and event-list components adapt small patterns from Magic UI. The official [Magic UI license](https://raw.githubusercontent.com/magicuidesign/magicui/main/LICENSE.md) is MIT and the notice is reproduced below. The local adaptations use this project's existing `framer-motion` package rather than adding the separate `motion` package. The event-list adaptation intentionally does not copy Magic UI's timed reveal loop; it animates only keyed items that enter or leave when underlying demo data changes.

Source references:

- [Number Ticker](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/number-ticker.tsx)
- [Animated List registry source](https://magicui.design/r/animated-list.json)
- [Animated Theme Toggler](https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/animated-theme-toggler.tsx)

```text
MIT License

Copyright (c) Magic UI

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

Aceternity Liquid Glass and Tracing Beam were evaluated as documented references, not copied or added as dependencies. React Bits' count-up example was not copied; see `docs/design-reference-implementation.md` for the verified component/license and compatibility decisions.
