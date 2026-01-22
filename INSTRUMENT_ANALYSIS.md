# Chladni Pattern Analysis: Instrument Differences from C3 to E4

## A School Project Guide to Understanding How Different Instruments Create Unique Visual Patterns

---

## Table of Contents

1. [Introduction to Chladni Patterns](#introduction-to-chladni-patterns)
2. [The Instruments: C3 to E4 Range](#the-instruments-c3-to-e4-range)
3. [Visual Differences Between Instruments](#visual-differences-between-instruments)
4. [The Mathematics Behind the Patterns](#the-mathematics-behind-the-patterns)
5. [Scientific Explanation: Why Each Instrument is Different](#scientific-explanation-why-each-instrument-is-different)
6. [Summary Table](#summary-table)

---

## Introduction to Chladni Patterns

Chladni patterns are the beautiful geometric shapes that form when a vibrating plate is covered with fine particles (like sand). Named after German physicist Ernst Chladni (1756-1827), these patterns reveal the "nodal lines" of a vibrating surface—the areas that don't move while the rest of the plate oscillates up and down.

When you play a musical instrument, the sound waves it produces have a unique "fingerprint" called its **harmonic spectrum**. This simulation translates those harmonics into visual patterns using the Chladni equation.

### Note Frequencies (C3 to E4)

| Note | Frequency (Hz) |
|------|----------------|
| C3   | 130.81         |
| D3   | 146.83         |
| E3   | 164.81         |
| F3   | 174.61         |
| G3   | 196.00         |
| A3   | 220.00         |
| B3   | 246.94         |
| C4   | 261.63         |
| D4   | 293.66         |
| E4   | 329.63         |

---

## The Instruments: C3 to E4 Range

### Piano
- **Character**: Percussive, sustained, rich harmonics
- **Attack**: Quick hammer strike creates sharp transient
- **Decay**: Slow due to large soundboard resonance
- **Harmonics**: Strong presence up to the 8th harmonic

### Guitar
- **Character**: Plucked, warm, fundamental-heavy
- **Attack**: Fast pluck creates brief brightness
- **Decay**: Medium-fast due to string damping
- **Harmonics**: Emphasis on fundamental and low harmonics (1-5)

### Violin
- **Character**: Bowed, rich in odd harmonics
- **Attack**: Medium (bow grip)
- **Decay**: Sustained while bowing
- **Harmonics**: Strong odd harmonics (1st, 3rd, 5th, 7th) giving characteristic "edge"

### Flute
- **Character**: Blown, pure, near-sinusoidal
- **Attack**: Slow, breath-driven
- **Decay**: Sustained while blowing
- **Harmonics**: Mostly fundamental with very weak even harmonics

### Trumpet
- **Character**: Brassy, bright, powerful
- **Attack**: Fast lip buzz creates strong transient
- **Decay**: Medium
- **Harmonics**: Strong even and odd harmonics up to the 9th

### Cello
- **Character**: Bowed, warm, deep resonance
- **Attack**: Medium (similar to violin but slower)
- **Decay**: Sustained while bowing
- **Harmonics**: Balanced low-to-mid harmonics (1-6)

---

## Visual Differences Between Instruments

### Key Visual Differences (Obvious)

| Feature | Piano | Guitar | Violin | Flute | Trumpet | Cello |
|---------|-------|--------|--------|-------|---------|-------|
| **Pattern Complexity** | High | Medium | Very High | Low | High | Medium-High |
| **Line Density** | Dense | Moderate | Very Dense | Sparse | Dense | Moderate |
| **Symmetry** | Balanced | n-dominant | n-dominant | Simple | m-dominant | m-dominant |
| **Shape Character** | Square-ish | Rectangular | Elongated | Circular-ish | Rectangular | Square-ish |

### Subtle Visual Differences (Less Obvious)

1. **Piano vs. Cello**
   - Piano patterns have more **angular corners**
   - Cello patterns appear **smoother** and more rounded
   - Piano shows more **high-frequency ripples** due to stronger upper harmonics

2. **Guitar vs. Violin**
   - Guitar patterns are **simpler** with fewer intersecting lines
   - Violin patterns have **more complex intersections** due to odd harmonic emphasis
   - Guitar shows stronger **central node** emphasis

3. **Flute vs. All Others**
   - Flute produces **the simplest patterns** with minimal complexity
   - Near-pure fundamental creates almost **circular nodal lines**
   - Pattern resembles **basic concentric shapes**

4. **Trumpet vs. Piano**
   - Trumpet patterns are **vertically stretched** (m-dominant)
   - Piano patterns are **more balanced** between horizontal and vertical
   - Trumpet shows **sharper angles** due to bright attack

5. **Violin vs. Cello**
   - Violin patterns are **more elongated vertically** (higher n-dominance)
   - Cello patterns are **more horizontally spread** (higher m-dominance)
   - Violin shows **finer line detail** due to odd harmonic emphasis

### Pattern Changes Across Notes (C3 to E4)

As frequency increases from C3 (130.81 Hz) to E4 (329.63 Hz):

1. **All Instruments**: Pattern complexity increases
   - More nodal lines appear
   - Intersections become more numerous
   - Overall design becomes more intricate

2. **Low Notes (C3-F3)**: Simpler patterns with fewer lines
3. **Mid Notes (G3-C4)**: Moderate complexity, clear instrument differentiation
4. **High Notes (D4-E4)**: Maximum complexity, finest detail visible

### Tiny Differences to Note

1. **Edge curvature**: Piano edges curve inward; guitar edges curve outward
2. **Line thickness perception**: Violin lines appear thinner due to density
3. **Central void size**: Flute has larger central quiet zones
4. **Corner node count**: Trumpet shows more corner nodes than guitar
5. **Diagonal emphasis**: Cello shows slight diagonal line preference
6. **Line spacing regularity**: Flute has most regular spacing; violin most irregular
7. **Pattern rotation**: Each instrument's pattern appears slightly rotated relative to others
8. **Gradient smoothness**: String instruments show smoother amplitude gradients

---

## The Mathematics Behind the Patterns

### The Chladni Equation

The 2D Chladni equation used in this simulation is:

```
f(x, y) = a × sin(π × n × x) × sin(π × m × y) + b × sin(π × m × x) × sin(π × n × y)
```

Where:
- **x, y**: Position on the plate (normalized 0 to 1)
- **m, n**: Mode numbers (integer values determining pattern complexity)
- **a, b**: Amplitude coefficients (both set to 1)
- **π**: Pi (3.14159...)

The nodal lines occur where **f(x, y) = 0**.

### Physics-Based Frequency Relationship

The resonant frequency of a Chladni plate follows:

```
f_mn = (c / 2L) × √(m² + n²)
```

Where:
- **f_mn**: Resonant frequency in Hz
- **c**: Wave speed in the plate material (m/s)
- **L**: Plate length (m)
- **m, n**: Mode numbers

This means:
- **Higher frequency → Higher m² + n² → More complex patterns**
- **Lower frequency → Lower m² + n² → Simpler patterns**

### How Instruments Affect m and n

Each instrument has unique **preference weights** that influence which (m, n) pair is selected:

| Instrument | m_preference | n_preference | m_offset | n_offset |
|------------|--------------|--------------|----------|----------|
| Piano      | 0.50         | 0.50         | 0        | 0        |
| Guitar     | 0.20         | 0.80         | 3        | 7        |
| Violin     | 0.30         | 0.90         | 5        | 11       |
| Flute      | 0.10         | 0.10         | 2        | 3        |
| Trumpet    | 0.90         | 0.20         | 13       | 5        |
| Cello      | 0.80         | 0.30         | 9        | 4        |

**What these mean:**
- **m_preference/n_preference**: How much the instrument "prefers" patterns with higher m or n values
- **m_offset/n_offset**: Additional values added to ensure each instrument produces unique patterns

### Logarithmic Frequency Mapping

Musical notes follow a logarithmic scale (each octave doubles the frequency). The mapping uses:

```javascript
mapped = (log(freq) - log(minFreq)) × (maxRange - minRange) / (log(maxFreq) - log(minFreq)) + minRange
```

This ensures that:
- Notes feel evenly spaced visually
- Pattern complexity increases naturally with pitch
- Human perception of pitch change matches visual change

---

## Scientific Explanation: Why Each Instrument is Different

### The Real Science: Harmonic Overtones

Every musical instrument produces not just the fundamental frequency (the note you hear), but also **overtones** or **harmonics** at integer multiples of that frequency.

**Example: Playing C3 (130.81 Hz)**

| Harmonic | Frequency | Musical Interval |
|----------|-----------|------------------|
| 1st (fundamental) | 130.81 Hz | C3 (the note itself) |
| 2nd | 261.62 Hz | C4 (octave) |
| 3rd | 392.43 Hz | G4 (perfect fifth + octave) |
| 4th | 523.24 Hz | C5 (two octaves) |
| 5th | 654.05 Hz | E5 (major third + two octaves) |
| 6th | 784.86 Hz | G5 |
| 7th | 915.67 Hz | ~B♭5 |
| 8th | 1046.48 Hz | C6 |

### Why Each Instrument Has Different Harmonics

#### 1. **Piano** - Struck Strings with Soundboard

**Physical Mechanism**: A felt hammer strikes steel strings that vibrate against a large wooden soundboard.

**Why the pattern is unique**:
- The **hammer strike location** (typically 1/7 of the string length) suppresses the 7th harmonic
- The **large soundboard** allows strong coupling of multiple harmonics
- The **piano's inharmonicity** (strings are slightly stiff) causes harmonics to be slightly sharp
- Result: Rich, balanced harmonic content with strong high-frequency components

**Pattern characteristics**: Balanced m and n values produce symmetrical, complex patterns with many fine details.

#### 2. **Guitar** - Plucked Strings with Sound Hole

**Physical Mechanism**: Fingers or picks pluck nylon or steel strings over a resonating body with a sound hole.

**Why the pattern is unique**:
- **Plucking position** (usually 1/5 from the bridge) emphasizes the fundamental
- The **sound hole creates Helmholtz resonance** that boosts low frequencies
- **String damping** from fingers causes faster decay of high harmonics
- Result: Strong fundamental with quickly decaying upper harmonics

**Pattern characteristics**: High n_preference (0.80) creates vertically-elongated patterns with strong central emphasis.

#### 3. **Violin** - Bowed Strings with Resonant Body

**Physical Mechanism**: A rosined bow creates stick-slip friction on strings, with a carved wooden body resonating.

**Why the pattern is unique**:
- **Bowing creates sawtooth-like vibration** which emphasizes odd harmonics (1st, 3rd, 5th, 7th)
- The **body's f-holes and bass bar** create complex resonance
- **Continuous bowing** maintains sustained harmonic content
- Result: Rich odd-harmonic spectrum giving the characteristic "edge"

**Pattern characteristics**: Very high n_preference (0.90) and significant n_offset (11) creates the most vertically-stretched, complex patterns.

#### 4. **Flute** - Air Column in a Tube

**Physical Mechanism**: An air stream splits across an embouchure hole, creating vibrations in a cylindrical air column.

**Why the pattern is unique**:
- **Open-open tube resonance** naturally produces a near-pure fundamental
- **No vibrating solid material** means minimal mechanical harmonics
- The **cylindrical bore** produces octave-related harmonics (mostly even)
- Result: Almost pure sine wave with very weak harmonics

**Pattern characteristics**: Very low preferences (0.10, 0.10) produce the simplest, most circular patterns with minimal complexity.

#### 5. **Trumpet** - Lip Buzz in Brass Tubing

**Physical Mechanism**: Lip buzz creates vibrations that are amplified by a conical brass tube with a bell.

**Why the pattern is unique**:
- **Lip buzz is highly complex** with strong even and odd harmonics
- The **conical bore and bell** emphasize high frequencies
- **Brass resonance** adds brilliance and projection
- Result: Bright, powerful spectrum with strong upper partials

**Pattern characteristics**: Very high m_preference (0.90) creates horizontally-stretched patterns with sharp, angular features.

#### 6. **Cello** - Bowed Low Strings with Large Body

**Physical Mechanism**: Similar to violin but with longer, thicker strings and larger body.

**Why the pattern is unique**:
- **Lower frequency range** naturally produces different resonances
- **Larger body** has different modal patterns than violin
- **Thicker strings** have different stiffness characteristics
- Result: Warm, balanced harmonics with emphasis on low-to-mid content

**Pattern characteristics**: High m_preference (0.80) like trumpet but with different offsets, creating unique horizontally-biased but warmer patterns.

### The Complete Story: Instrument → Harmonics → Pattern

```
Instrument → Physical Mechanism → Harmonic Spectrum → m,n Selection → Chladni Pattern
```

1. **Physical construction** determines how sound is produced
2. **Sound production method** determines which harmonics are present and their relative strengths
3. **Harmonic analysis** (via FFT in the simulation) measures the frequency content
4. **Weighted selection algorithm** chooses optimal (m, n) values based on:
   - Base frequency matching physics formula
   - Instrument-specific preference weights
   - Harmonic content weighting
   - Unique offsets for guaranteed differentiation
5. **Chladni equation** renders the pattern using selected (m, n)

---

## Summary Table

### Complete Instrument Comparison for School Project

| Characteristic | Piano | Guitar | Violin | Flute | Trumpet | Cello |
|---------------|-------|--------|--------|-------|---------|-------|
| **Sound Production** | Struck strings | Plucked strings | Bowed strings | Blown air | Lip buzz | Bowed strings |
| **Number of Harmonics** | 8 | 5 | 7 | 2-4 | 9 | 6 |
| **Dominant Harmonics** | All (balanced) | 1st, 2nd | Odd (1,3,5,7) | 1st (nearly pure) | All (bright) | Lower (1-3) |
| **Attack Speed** | Fast | Very fast | Medium | Slow | Fast | Medium |
| **Decay Type** | Slow | Medium-fast | Sustained | Sustained | Medium | Sustained |
| **Pattern Symmetry** | Balanced (m≈n) | n-dominant | Very n-dominant | Minimal | m-dominant | m-dominant |
| **Pattern Complexity** | High | Medium | Very High | Low | High | Medium-High |
| **Unique Offset (m, n)** | (0, 0) | (3, 7) | (5, 11) | (2, 3) | (13, 5) | (9, 4) |
| **Visual Character** | Intricate grid | Stretched vertical | Dense vertical | Simple circular | Stretched horizontal | Warm angular |

### Key Mathematical Parameters

| Note | Frequency | Approximate m² + n² Target |
|------|-----------|----------------------------|
| C3   | 130.81 Hz | ~7,613                     |
| D3   | 146.83 Hz | ~9,588                     |
| E3   | 164.81 Hz | ~12,080                    |
| F3   | 174.61 Hz | ~13,562                    |
| G3   | 196.00 Hz | ~17,085                    |
| A3   | 220.00 Hz | ~21,522                    |
| B3   | 246.94 Hz | ~27,126                    |
| C4   | 261.63 Hz | ~30,441                    |
| D4   | 293.66 Hz | ~38,365                    |
| E4   | 329.63 Hz | ~48,327                    |

*Note: Target values calculated using f = 1.5/(2×0.5) × √(m² + n²), showing how higher frequencies require higher mode numbers.*

---

## Conclusion

The beautiful Chladni patterns you see are not random—they're a direct visual representation of the physics of sound. Each instrument's unique construction and playing technique creates a distinctive harmonic fingerprint that translates into unique patterns on the vibrating plate.

**For your school project, remember:**

1. **The Math**: The Chladni equation f(x,y) = a·sin(πnx)·sin(πmy) + b·sin(πmx)·sin(πny) creates nodal patterns
2. **The Physics**: Higher frequency = higher m,n values = more complex patterns
3. **The Music**: Each instrument's harmonics determine which (m,n) pair best represents its sound
4. **The Result**: Visual "fingerprints" that uniquely identify each instrument

This project demonstrates the beautiful intersection of physics, mathematics, and music!
