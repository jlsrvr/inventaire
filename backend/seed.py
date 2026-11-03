"""Seed the items table from the chalet's paper inventory sheet.

Only the item name, stock quantity, and unit were used (columns 1-3 of the
source table) — the sheet's "besoin achat" / update-date columns were tracking
the same thing our `quantity == 0` convention already does, so they're
dropped. A blank quantity cell in the source became 0 here.

Run with: uv run seed.py
Add --force to seed even if the items table already has rows.
"""

import sys
import uuid

import config
import db
import timestamps

# (name, category, quantity, unit)
SEED_ITEMS = [
    # --- Cave ---
    ("Haricot vert", "alimentation", 1, None),
    ("Coq au vin", "alimentation", 1, None),
    ("Cassoulet confit", "alimentation", 2, None),
    ("Jus orange", "boissons", 0, None),
    ("Jus pomme", "boissons", 2, None),
    ("Lait avoine", "boissons", 1, None),
    ("Lait amande", "boissons", 0, None),
    ("Jus de tomate", "boissons", 1, None),
    ("Scheeps", "boissons", 3, None),
    ("Seven up mojito", "boissons", 1, None),
    ("Sucre de canne", "alimentation", 2, "Litre"),
    ("Coca cola", "boissons", 0, None),
    ("Salvetat", "boissons", 12, "Bouteille"),
    ("Cristalline", "boissons", 12, "Bouteille"),
    ("Biere alfygen", "boissons", 10, "Bouteille"),
    ("Rosé", "boissons", 1, "Cubi 5L"),
    ("Rouge", "boissons", 1, "Cubi 5L"),
    ("Blanc", "boissons", 1, "Cubi 5L"),
    ("Clairette de die", "boissons", 3, None),
    ("Champagne", "boissons", 1, "Bouteille"),
    ("Huile", "alimentation", 1, "Bidon 3L"),
    ("Isio", "alimentation", 1, "Bouteille"),
    ("Huile olive", "alimentation", 1, "Litre"),
    ("Lait entier", "boissons", 0, "Litre"),
    ("Lait ½ écrème", "boissons", 3, "½ Litre"),
    ("Crème liquide", "alimentation", 3, "25 cl"),
    # --- Placard petit déjeuner ---
    ("Biscotte", "alimentation", 1.5, "paquet"),
    ("Pain grille", "alimentation", 1, "paquet"),
    ("Compote", "alimentation", 0, None),
    ("Céréales barres", "alimentation", 2, "paquet"),
    ("Fruits secs", "alimentation", 1, "paquet"),
    ("Pruneaux agen", "alimentation", 1, "sachet"),
    ("Abricot sec", "alimentation", 1, "sachet"),
    ("Miel", "alimentation", 0, "pot"),
    ("Confiture", "alimentation", 0, "pot"),
    ("Pain de mie", "alimentation", 0, "paquet"),
    ("Café soluble", "alimentation", 1, "pot 250gr"),
    ("Café", "alimentation", 2, "paquet"),
    ("Filtre à café", "alimentation", 0, None),
    ("Chocolat en poudre", "alimentation", 1, "boite"),
    ("Thé vert / roibos", "alimentation", 1, "boite"),
    ("Infusion", "alimentation", 2, "boite"),
    ("Chocolat", "alimentation", 0.5, "plaquette"),
    ("Sucre glace", "alimentation", 1, "paquet"),
    ("Sucre poudre", "alimentation", 1, "paquet"),
    ("Sucre confiture", "alimentation", 1, "paquet"),
    ("Levure chimique", "alimentation", 1, "paquet"),
    ("Bicarbonate", "alimentation", 1, "paquet"),
    ("Gélatine", "alimentation", 1, "paquet"),
    ("Poudre amande", "alimentation", 1, "sachet"),
    ("Cannelle", "alimentation", 1, "flacon"),
    ("Amande amère", "alimentation", 1, "flacon"),
    # --- Placard du berger ---
    ("Riz basmati", "alimentation", 1, "paquet"),
    ("Risotto", "alimentation", 0.25, "paquet"),
    ("Polenta", "alimentation", 1, "paquet"),
    ("Boulgour", "alimentation", 1, "paquet"),
    ("Crozet", "alimentation", 2, "paquet"),
    ("Purée flocon", "alimentation", 0.5, "paquet"),
    ("Pates", "alimentation", 0.5, "kg"),
    ("Spaghetti", "alimentation", 0, "kg"),
    ("Cannelloni tube", "alimentation", 1.5, "paquet"),
    ("Lasagne plaque", "alimentation", 0.5, "paquet"),
    ("Farine de blé", "alimentation", 1, "kg"),
    ("Soupe", "alimentation", 3, "litre"),
    ("Soupe de poisson et rouille", "alimentation", 1, "litre"),
    ("Soupe", "alimentation", 3, "sachet"),
    ("Haricot blanc", "alimentation", 1, "boite"),
    ("Mogette", "alimentation", 1, "paquet"),
    ("Flageolet", "alimentation", 2, "boite"),
    ("Pois chiche", "alimentation", 5, "boite"),
    ("Haricot vert 250 gr", "alimentation", 2, "boite"),
    ("Salsifis", "alimentation", 1, "boite"),
    ("Sardines", "alimentation", 5, "boite"),
    ("Thon emiette", "alimentation", 0, "boite"),
    ("Champignon de paris", "alimentation", 1, "petite boite"),
    ("Sauce tomate Barilla", "alimentation", 1, "boite"),
    ("Pulpe tomate", "alimentation", 2, "boite"),
    ("Tomato coulis", "alimentation", 2, None),
    ("Cornichons", "alimentation", 1.5, None),
    ("Bouillon cube", "alimentation", 1, None),
    ("Sauce madère", "alimentation", 1, None),
    ("Moutarde", "alimentation", 2, None),
    ("Chips", "alimentation", 0, None),
    ("TUC gateau apero", "alimentation", 0, None),
    ("Savane marbre chocolat", "alimentation", 0, None),
    # --- Hygiène et pharmacie ---
    ("Papier toilette", "hygiene", 9, "rouleau"),
    ("Sopalin", "entretien", 3, "rouleau"),
    ("Mouchoir en papier", "hygiene", 3, "paquet"),
    ("Sac poubelle", "entretien", 1, "rouleau"),
    ("Eponge", "entretien", 4, None),
    ("Produit vaisselle", "entretien", 2, None),
    ("Allumettes", "entretien", 2, "boite"),
    ("Gaz recharge", "entretien", 0, None),
    ("Spirale anti moustique", "entretien", 2, "boite"),
    ("Attrape mouche", "entretien", 3, "rouleau"),
    ("Savon main", "hygiene", 1, None),
    ("Maalox", "hygiene", 1, None),
    ("Fervex", "hygiene", 1, None),
    ("Biafine", "hygiene", 1, None),
    ("Citrate de bétaine", "hygiene", 1, None),
    ("Cranberry", "hygiene", 0, None),
    ("Eparcyl sachet", "hygiene", 1, "boite"),
    ("Détartrant bouilloire", "entretien", 0, None),
    ("Crème main", "hygiene", 0, None),
    ("Stick lèvre", "hygiene", 0, None),
    # --- Matériel ---
    ("Pile AAA", "outils", 1, None),
    ("Clé à évier", "outils", 1, None),
]


def seed(force: bool = False) -> None:
    db.init_db()
    conn = db.connect()
    try:
        count = conn.execute("SELECT COUNT(*) FROM items").fetchone()[0]
        if count and not force:
            print(
                f"items already has {count} row(s) — pass --force to seed anyway."
            )
            return

        next_seq = conn.execute("SELECT COALESCE(MAX(seq), 0) FROM items").fetchone()[0]
        now = timestamps.format(timestamps.now())

        for name, category, quantity, unit in SEED_ITEMS:
            next_seq += 1
            conn.execute(
                """
                INSERT INTO items
                    (id, name, category, quantity, unit, updated_at, updated_by, seq)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    name,
                    category,
                    quantity,
                    unit,
                    now,
                    "L'Homme à la Hache",
                    next_seq,
                ),
            )

        conn.commit()
        print(f"Seeded {len(SEED_ITEMS)} items into {config.DB_PATH}.")
    finally:
        conn.close()


if __name__ == "__main__":
    seed(force="--force" in sys.argv)
