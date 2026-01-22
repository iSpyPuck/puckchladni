A small physics demonstration using p5.js.

[https://addiebarron.github.io/chladni](https://ispypuck.github.io/puckchladni/)

**Chladni patterns** form when a speaker playing a set frequency is placed underneath a square plate covered with sand. You can see an example [here](https://www.youtube.com/watch?v=tFAcYruShow).

![Screenshot](screenshot.png)

I used the derivation [here](https://thelig.ht/chladni/) for a closed-form solution to the wave equation. The derivation makes some simplifications, including setting the boundary conditions of the plate to 0 (when they'd actually be vibrating freely and described by some complex PDEs outlined on that page). For the sake of writing this code in a single evening, I chose not to delve much deeper.

## Instrument Analysis Documentation

For a detailed analysis of how different musical instruments produce unique Chladni patterns, including the mathematics and physics behind the differences, see **[INSTRUMENT_ANALYSIS.md](INSTRUMENT_ANALYSIS.md)**. This documentation covers:

- Key visual differences for each instrument (Piano, Guitar, Violin, Flute, Trumpet, Cello)
- Note frequencies from C3 to E4
- The Chladni equation and physics formulas
- Scientific explanations for why each instrument creates different patterns
- Summary tables for school projects
