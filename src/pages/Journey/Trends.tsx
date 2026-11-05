/**
 * TENDANCES — l'analyse de Journey.
 *
 * RÈGLE DE CONDUITE DE CET ÉCRAN
 * ------------------------------
 * Aucun chiffre n'est affiché s'il ne peut pas être calculé. Un écart sur deux
 * points, une corrélation sur trois jours, une comparaison à une période vide :
 * tout cela est REFUSÉ et remplacé par une phrase qui dit pourquoi.
 *
 * C'est la leçon du retrait de l'indicateur de tendance : une mesure fausse a
 * l'air d'une mesure. L'écran affiche donc la méthode quand il affiche un
 * résultat, et l'absence quand il n'en a pas.
 *
 * TROIS CROISEMENTS, ET PAS UN SEUL
 * ---------------------------------
 *   - habitudes ↔ humeur : seulement si les deux sont documentés le même jour ;
 *   - objectifs ↔ humeur : l'humeur des jours de MOUVEMENT contre l'humeur
 *     générale — jamais la progression, qui est un cumul et monterait
 *     mécaniquement avec le temps ;
 *   - challenges : comptage, sans croisement d'humeur (les challenges sont
 *     trop courts pour porter un échantillon honnête).
 */
import { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Minus, Sparkles, Target } from 'lucide-react';
import { Badge } from '@/components/badges';
import { Card } from '@/components/cards';
import { ErrorState, LoadingState } from '@/components/feedback';
import { ProgressBar } from '@/components/progress';
import { buildTrendsReport, type TrendsReport } from '@/services/analytics.service';

const TREND_LABELS = {
  up: 'En hausse',
  down: 'En baisse',
  stable: 'Stable',
} as const;

/** Icône associée au sens de la tendance. */
function TrendIcon({ direction }: { direction: 'up' | 'down' | 'stable' }) {
  if (direction === 'up') return <ArrowUpRight size={14} aria-hidden="true" />;
  if (direction === 'down') return <ArrowDownRight size={14} aria-hidden="true" />;
  return <Minus size={14} aria-hidden="true" />;
}

export function Trends() {
  const [report, setReport] = useState<TrendsReport | null>(null);
  const [window_, setWindow] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      setReport(await buildTrendsReport(days));
    } catch {
      setError("L'analyse n'a pas pu être calculée. Tes données sont intactes.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(window_);
  }, [load, window_]);

  if (loading) return <LoadingState label="Calcul des tendances…" compact />;
  if (error) return <ErrorState message={error} onRetry={() => void load(window_)} />;
  if (!report) return null;

  const { mood, habits, correlations, goalPace, challenges } = report;

  return (
    <section className="journey-section" aria-labelledby="trends-heading">
      <header className="journey-section__head">
        <div>
          <p className="overline">Tendances</p>
          <h2 className="heading-sm" id="trends-heading">
            Ce que tes données racontent
          </h2>
        </div>
        <div className="journey-range" role="group" aria-label="Période analysée">
          <button
            type="button"
            className={window_ === 7 ? 'journey-range__item is-active' : 'journey-range__item'}
            aria-pressed={window_ === 7}
            onClick={() => setWindow(7)}
          >
            7 jours
          </button>
          <button
            type="button"
            className={window_ === 30 ? 'journey-range__item is-active' : 'journey-range__item'}
            aria-pressed={window_ === 30}
            onClick={() => setWindow(30)}
          >
            30 jours
          </button>
        </div>
      </header>

      {report.insufficientData && <p className="body-sm journey-note">{report.insufficientData}</p>}

      {/* --- Humeur ------------------------------------------------------- */}
      <Card compact>
        <div className="journey-stat__head">
          <p className="data-label">Humeur</p>
          {mood.trend && mood.trend.reliable && (
            <Badge tone={mood.trend.direction === 'down' ? 'warning' : 'accent'}>
              <TrendIcon direction={mood.trend.direction} />
              {TREND_LABELS[mood.trend.direction]}
            </Badge>
          )}
        </div>

        <p className="stat-value">{mood.average === null ? '—' : `${mood.average} / 5`}</p>
        <p className="body-sm">
          {mood.entries === 0
            ? 'Aucune humeur notée sur la période.'
            : `Moyenne sur ${mood.entries} jour${mood.entries > 1 ? 's' : ''} noté${mood.entries > 1 ? 's' : ''}.`}
        </p>

        {mood.trend && mood.trend.reliable && (
          <p className="body-sm journey-note">
            Écart de {mood.trend.delta > 0 ? '+' : ''}
            {mood.trend.delta} point entre le début et la fin de la période. {mood.trendMethod}
          </p>
        )}
        {mood.trend && !mood.trend.reliable && mood.entries > 0 && (
          <p className="body-sm journey-note">
            Trop peu de points pour un écart fiable : il en faut au moins quatre.
          </p>
        )}

        {mood.weekOverWeek && (
          <p className="body-sm">
            Sept derniers jours : {mood.last7Average} / 5, contre{' '}
            {mood.last7Average
              ? (mood.last7Average - mood.weekOverWeek.delta).toFixed(1)
              : '—'}{' '}
            / 5 la semaine précédente
            {mood.weekOverWeek.percent !== null &&
              ` (${mood.weekOverWeek.percent > 0 ? '+' : ''}${mood.weekOverWeek.percent} %)`}
            .
          </p>
        )}

        <p className="body-sm">Plus longue série de jours documentés : {mood.presenceStreak}.</p>
      </Card>

      {/* --- Habitudes ---------------------------------------------------- */}
      {habits.length > 0 && (
        <Card compact>
          <p className="data-label">Habitudes</p>
          {habits.map((habit) => (
            <div key={habit.habitId} className="journey-trend-row">
              <div className="journey-stat__head">
                <span className="body-base">{habit.name}</span>
                {habit.trend && habit.trend.reliable && (
                  <span className="body-sm">
                    <TrendIcon direction={habit.trend.direction} />{' '}
                    {TREND_LABELS[habit.trend.direction]}
                  </span>
                )}
              </div>

              {habit.regularity === null ? (
                <p className="body-sm">Aucun jour attendu sur la période.</p>
              ) : (
                <>
                  <ProgressBar
                    value={habit.regularity}
                    tone={habit.accent}
                    size="sm"
                    label={`Régularité de ${habit.name}`}
                  />
                  <p className="body-sm">
                    {habit.completed} jour{habit.completed > 1 ? 's' : ''} coché
                    {habit.completed > 1 ? 's' : ''} sur {habit.expected} attendu
                    {habit.expected > 1 ? 's' : ''} — {habit.regularity} %.
                  </p>
                </>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* --- Liens habitudes ↔ humeur ------------------------------------- */}
      <Card compact>
        <p className="data-label">Liens observés — habitudes</p>
        {correlations.length === 0 ? (
          <p className="body-sm">
            Aucun lien ne se dégage pour l'instant. Il faut au moins sept jours où
            l'humeur et l'habitude sont documentées le même jour pour que la
            comparaison ait un sens.
          </p>
        ) : (
          <ul className="journey-correlation-list">
            {correlations.map((item) => (
              <li key={item.habitId} className="journey-correlation">
                <Badge tone="inspiration">
                  <Activity size={12} aria-hidden="true" />
                  {item.coefficient > 0 ? '+' : ''}
                  {item.coefficient}
                </Badge>
                <p className="body-sm">{item.reading}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="body-sm journey-note">
          Ces liens décrivent une coïncidence dans tes données. Ils ne disent rien d'une cause.
        </p>
      </Card>

      {/* --- Objectifs ↔ humeur ------------------------------------------- */}
      <Card compact>
        <p className="data-label">Liens observés — objectifs</p>

        {goalPace.length === 0 ? (
          <p className="body-sm">
            Aucun objectif actif n'a bougé pendant cette période, ou l'humeur n'y était pas notée
            les jours concernés. Fais avancer un objectif le jour où tu notes ton humeur, et le
            croisement apparaîtra ici.
          </p>
        ) : (
          <ul className="journey-correlation-list">
            {goalPace.map((item) => (
              <li key={item.goalId} className="journey-goal-pace">
                <div className="journey-stat__head">
                  <span className="body-base">
                    <Target size={14} aria-hidden="true" className="journey-goal-pace__icon" />{' '}
                    {item.title}
                  </span>
                  <span className="data-value">{item.progress} %</span>
                </div>

                {item.reading !== null ? (
                  <p className="body-sm">{item.reading}</p>
                ) : (
                  <p className="body-sm">
                    Les jours de mouvement sont trop proches de ta moyenne globale pour qu'on en
                    dise quelque chose : l'écart n'atteint pas un demi-point.
                  </p>
                )}

                {item.delta !== null && (
                  <p className="body-sm journey-goal-pace__meta">
                    Humeur les jours de mouvement : {item.moodOnUpdateDays} / 5 · moyenne générale :{' '}
                    {item.moodOverall} / 5 · écart : {item.delta > 0 ? '+' : ''}
                    {item.delta}.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="body-sm journey-note">
          On compare l'humeur des jours où un objectif a bougé à ta moyenne de la période. Ce
          n'est pas la progression qui est croisée : elle monte avec le temps, et le lien
          paraîtrait vrai par construction.
        </p>
      </Card>

      {/* --- Challenges --------------------------------------------------- */}
      <Card compact>
        <div className="journey-stat__head">
          <p className="data-label">Challenges</p>
          <Badge tone="accent">
            <Sparkles size={12} aria-hidden="true" />
            Jalons : {challenges.milestonesReached}
          </Badge>
        </div>
        <div className="journey-stat-grid">
          <div>
            <p className="data-label">En cours</p>
            <p className="data-value">{challenges.active}</p>
          </div>
          <div>
            <p className="data-label">Terminés</p>
            <p className="data-value">{challenges.completed}</p>
          </div>
        </div>
        <p className="body-sm">
          {challenges.averageProgress === null
            ? 'Aucun challenge en cours à évaluer.'
            : `Avancement moyen des challenges en cours : ${challenges.averageProgress} %.`}
        </p>
        {challenges.postponedDays > 0 && (
          <p className="body-sm">
            {challenges.postponedDays} jour{challenges.postponedDays > 1 ? 's' : ''} reporté
            {challenges.postponedDays > 1 ? 's' : ''} au total — décaler fait partie du parcours.
          </p>
        )}
      </Card>
    </section>
  );
}
