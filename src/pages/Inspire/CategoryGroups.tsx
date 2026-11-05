import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { INSPIRATION_CATEGORY_LABELS, type InspirationCategory } from '@/types';

/**
 * Groupes de contenu par categorie, chacun repliable.

 * POURQUOI CE COMPOSANT
   ---------------------
 * Les citations s'affichaient en une seule liste de 48 elements. On ne pouvait
 * ni voir les themes disponibles, ni aller directement a celui qui parle — il
 * fallait defiler tout le contenu.
 *
 * Ici, les categories sont affichees en TETES DE GROUPE, dans un menu
 * deroulant : on choisit une categorie pour ne voir que celle-la, ou on laisse
 * « Toutes » et on ouvre le groupe qui interesse.
 *
 * REGLE : les donnees viennent de la banque editoriale, jamais d'une liste
 * ecrite a la main dans ce fichier. Une categorie vide ne peut donc pas
 * apparaitre, et une nouvelle categorie ajoutee au contenu apparaitra seule.
 */

export interface CategoryGroup<T> {
  category: InspirationCategory;
  items: T[];
}

/** Regroupe une liste d'elements par categorie, dans l'ordre du contenu. */
export function groupByCategory<T extends { category: InspirationCategory }>(
  items: T[],
): CategoryGroup<T>[] {
  const groups: CategoryGroup<T>[] = [];
  const index = new Map<InspirationCategory, number>();

  for (const item of items) {
    const existing = index.get(item.category);
    if (existing === undefined) {
      index.set(item.category, groups.length);
      groups.push({ category: item.category, items: [item] });
    } else {
      groups[existing]?.items.push(item);
    }
  }

  return groups;
}

export interface CategoryGroupsProps<T> {
  groups: CategoryGroup<T>[];
  /** Rendu d'un element du groupe. */
  renderItem: (item: T) => ReactNode;
  /** Cle unique d'un element. */
  itemKey: (item: T) => string;
}

/**
 * Affichage groupe avec selection de categorie.
 *
 * Le menu deroulant sert de FILTRE : « Toutes les categories » affiche tous les
 * groupes, une categorie precise n'affiche que le sien. Les groupes restent
 * repliables individuellement, pour garder un ecran court meme quand tout est
 * affiche.
 */
export function CategoryGroups<T>({ groups, renderItem, itemKey }: CategoryGroupsProps<T>) {
  const [selected, setSelected] = useState<InspirationCategory | 'all'>('all');

  const visible = useMemo(
    () => (selected === 'all' ? groups : groups.filter((group) => group.category === selected)),
    [groups, selected],
  );

  // Par defaut, le premier groupe est ouvert : l'ecran ne doit jamais etre une
  // suite de titres replies sans contenu visible.
  const [openCategories, setOpenCategories] = useState<InspirationCategory[]>(
    groups[0] ? [groups[0].category] : [],
  );

  const isOpen = (category: InspirationCategory): boolean =>
    selected !== 'all' || openCategories.includes(category);

  const toggle = (category: InspirationCategory) => {
    setOpenCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  return (
    <div className="category-groups">
      <label className="category-select">
        <span className="category-select__label data-label">Categorie</span>
        <select
          className="category-select__control"
          value={selected}
          onChange={(event) =>
            setSelected(event.target.value === 'all' ? 'all' : (event.target.value as InspirationCategory))
          }
        >
          <option value="all">Toutes les categories ({groups.reduce((sum, g) => sum + g.items.length, 0)})</option>
          {groups.map((group) => (
            <option key={group.category} value={group.category}>
              {INSPIRATION_CATEGORY_LABELS[group.category]} ({group.items.length})
            </option>
          ))}
        </select>
      </label>

      {visible.length === 0 ? (
        <p className="body-sm">Aucun element dans cette categorie.</p>
      ) : (
        visible.map((group) => {
          const open = isOpen(group.category);
          const headingId = 'group-' + group.category;

          return (
            <section key={group.category} className="category-group" aria-labelledby={headingId}>
              <button
                type="button"
                className={open ? 'category-group__head is-open' : 'category-group__head'}
                aria-expanded={open}
                aria-controls={headingId + '-content'}
                onClick={() => toggle(group.category)}
                disabled={selected !== 'all'}
              >
                <ChevronRight size={16} aria-hidden="true" className="category-group__chevron" />
                <span className="category-group__title" id={headingId}>
                  {INSPIRATION_CATEGORY_LABELS[group.category]}
                </span>
                <span className="category-group__count">{group.items.length}</span>
              </button>

              {open && (
                <ul className="inspire-list" id={headingId + '-content'}>
                  {group.items.map((item) => (
                    <li key={itemKey(item)}>{renderItem(item)}</li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
