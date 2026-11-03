import { useEffect, useState } from 'react';
import { Button } from '@/components/buttons';
import { Input, Textarea } from '@/components/inputs';
import { LoadingState } from '@/components/feedback';
import { useToast } from '@/components/feedback/Toast';
import { useProfile } from '@/hooks/useProfile';
import { formatDateKey } from '@/utils/dates';

/**
 * Profil local.
 *
 * Aucun compte, aucun identifiant distant : le profil décrit une personne, il
 * ne l'authentifie pas. Le prénom et l'intention servent à personnaliser
 * l'accueil — ils restent sur l'appareil.
 */
export function Profile() {
  const { profile, loading, saveProfile, refresh } = useProfile();
  const { notify } = useToast();

  const [firstName, setFirstName] = useState('');
  const [intention, setIntention] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setIntention(profile.intention);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await saveProfile({ firstName, intention });
    setSaving(false);
    notify('Profil enregistré.', { tone: 'success' });
  };

  if (loading && !profile) return <LoadingState label="Lecture de ton profil…" compact />;

  return (
    <section className="me-section" aria-labelledby="profile-heading">
      <header>
        <p className="overline">Profil</p>
        <h2 className="heading-sm" id="profile-heading">
          Comment on t'appelle
        </h2>
      </header>

      <Input
        label="Prénom"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        placeholder="Ton prénom, ou un surnom"
        hint="Utilisé uniquement pour t'accueillir dans l'application."
      />

      <Textarea
        label="Ton intention"
        value={intention}
        onChange={(event) => setIntention(event.target.value)}
        placeholder="Pourquoi tu ouvres ZENTIQ…"
        hint="Une phrase que tu pourras relire les jours où la motivation manque."
        rows={3}
      />

      <div className="row-between">
        <Button variant="primary" onClick={() => void handleSave()} loading={saving}>
          Enregistrer
        </Button>
        {profile?.startedAt && (
          <span className="body-sm">
            Ici depuis le{' '}
            {formatDateKey(profile.startedAt, { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>
    </section>
  );
}
