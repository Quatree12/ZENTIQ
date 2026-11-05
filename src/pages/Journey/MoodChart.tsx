/**
 * Graphique d'evolution de l'humeur.
 *
 * Concu comme un SVG inline plutot qu'une librairie de graphiques : le trace
 * est simple (une ligne, des points, une grille discrete), il pese quelques
 * centaines d'octets, il s'affiche hors ligne, et il suit exactement les tokens
 * du design system. Aucune dependance ajoutee.
 *
 * ACCESSIBILITE : le SVG est `aria-hidden`, et un tableau de donnees
 * visuellement masque porte l'information pour les lecteurs d'ecran. Une courbe
 * seule n'est pas lisible autrement.
 */
import { useMemo } from 'react';
import type { MoodPoint } from '@/utils/journey-stats';
import { MOOD_LABELS } from '@/types';
import { formatDateKey } from '@/utils/dates';
import './MoodChart.css';

export interface MoodChartProps {
  points: MoodPoint[];
  /** Hauteur du trace en pixels. */
  height?: number;
  /** Libelle accessible du graphique. */
  label?: string;
}

const WIDTH = 320;
const PADDING = { top: 12, right: 8, bottom: 18, left: 8 };

/** Couleur du trait selon le niveau d'humeur — tokens du design system. */
function toneVar(mood: number): string {
  if (mood >= 5) return 'var(--color-mood-5)';
  if (mood === 4) return 'var(--color-mood-4)';
  if (mood === 3) return 'var(--color-mood-3)';
  if (mood === 2) return 'var(--color-mood-2)';
  return 'var(--color-mood-1)';
}

export function MoodChart({ points, height = 132, label = "Evolution de l'humeur" }: MoodChartProps) {
  const geometry = useMemo(() => {
    const innerWidth = WIDTH - PADDING.left - PADDING.right;
    const innerHeight = height - PADDING.top - PADDING.bottom;
    const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

    // L'echelle va de 1 a 5 : le bas du cadre est le niveau 1, pas zero. Sans
    // cela, une humeur stable a 5 paraitrait plate au milieu du graphique.
    const toY = (mood: number) =>
      PADDING.top + innerHeight - ((mood - 1) / 4) * innerHeight;

    const coords = points.map((point, index) => ({
      point,
      x: PADDING.left + index * stepX,
      y: point.mood === null ? null : toY(point.mood),
    }));

    // Segments continus : on trace une polyligne par serie de jours renseignes,
    // ce qui evite de relier deux points separes par une journee vide.
    const segments: string[] = [];
    let current: string[] = [];

    for (const coord of coords) {
      if (coord.y === null) {
        if (current.length > 1) segments.push(current.join(' '));
        current = [];
      } else {
        current.push(coord.x.toFixed(1) + ',' + coord.y.toFixed(1));
      }
    }
    if (current.length > 1) segments.push(current.join(' '));

    const gridLines = [1, 2, 3, 4, 5].map((level) => ({
      level,
      y: toY(level),
    }));

    return { coords, segments, gridLines, innerWidth };
  }, [points, height]);

  return (
    <figure className="mood-chart">
      <svg
        viewBox={'0 0 ' + WIDTH + ' ' + height}
        className="mood-chart__svg"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {geometry.gridLines.map((line) => (
          <line
            key={line.level}
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={line.y}
            y2={line.y}
            className="mood-chart__grid"
          />
        ))}

        {geometry.segments.map((segment, index) => (
          <polyline key={index} points={segment} className="mood-chart__line" />
        ))}

        {geometry.coords.map((coord) =>
          coord.y === null ? (
            <circle
              key={coord.point.date}
              cx={coord.x}
              cy={height - PADDING.bottom}
              r={1.6}
              className="mood-chart__gap"
            />
          ) : (
            <circle
              key={coord.point.date}
              cx={coord.x}
              cy={coord.y}
              r={3}
              className="mood-chart__dot"
              style={{ fill: toneVar(coord.point.mood ?? 3) }}
            />
          ),
        )}
      </svg>

      {/* Donnees portees pour les lecteurs d'ecran : une courbe seule ne dit rien. */}
      <figcaption className="sr-only">
        {label} :
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Jour</th>
              <th scope="col">Humeur</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.date}>
                <th scope="row">{formatDateKey(point.date, { day: 'numeric', month: 'short' })}</th>
                <td>{point.mood === null ? 'aucune entree' : MOOD_LABELS[point.mood]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
