import type { Density, Grid } from '../../print/sheet';

// Helpers shared by the Robotműhely sheets.

export const pickGrid = (density: Density, big: Grid, normal: Grid, many: Grid): Grid => (density === 'big' ? big : density === 'many' ? many : normal);
