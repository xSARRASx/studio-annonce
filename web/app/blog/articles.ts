/** Blog content. Drafts stay out of the index, static routes and sitemap. See docs/BLOG.md. */
export type BlogArticle = {
  slug: string; status: "draft" | "published"; title: string; description: string;
  date: string; category: string; coverExample: string; intro: string;
  sections: { title: string; paragraphs: string[]; examples?: string[] }[];
};
export const BLOG_ARTICLES: readonly BlogArticle[] = [{
  slug: "retouche-photo-immobiliere-exemples-avant-apres",
  status: "published", date: "2026-09-30", category: "Photos & décoration",
  title: "Retouche photo immobilière : huit avant/après pour trouver votre direction.",
  description: "Lumière, peinture, mobilier ou rénovation virtuelle : huit exemples concrets pour choisir les changements à demander sur une photo de logement.",
  coverExample: "salon-canape-rouille",
  intro: "Entre éclaircir une pièce et changer toute sa décoration, il y a beaucoup de possibilités. Ces huit exemples partent de photographies de quatre logements. Ils montrent des choix différents, avec l’original toujours disponible pour comparer.",
  sections: [
    { title: "Commencer par ce que l’on souhaite garder.", paragraphs: [
      "Avant de choisir une ambiance, regardez ce qui définit votre pièce : ses portes, ses fenêtres, ses passages et ses équipements fixes. Un radiateur ou une ouverture ne doit pas disparaître pour rendre une composition plus jolie. Ces repères aident à vérifier si la proposition reste fidèle à l’espace.",
      "Décrivez ensuite les éléments que vous aimez déjà. Un canapé, une table ou un parquet peuvent donner une direction à toute la décoration. Dire « garde le canapé rouille » est plus précis que demander uniquement « un beau salon ». La demande devient plus facile à relire, et le résultat plus facile à juger."
    ], examples: ["salon-canape-rouille"] },
    { title: "Mettre en valeur sans redécorer.", paragraphs: [
      "Si la pièce vous convient, concentrez la demande sur la photographie : exposition, équilibre des couleurs, présentation des textiles et petits objets qui attirent trop l’œil. Dans le salon de Ruaudin, la proposition conserve les meubles. L’écran de télévision éteint et les coussins soignés rendent l’ensemble plus calme.",
      "La comparaison doit aussi porter sur les textures. Un canapé ne gagne pas à devenir parfaitement lisse, ni une fenêtre à être entièrement blanche. Pour une annonce, recherchez une lumière lisible et des matières reconnaissables, en gardant la photo originale comme référence."
    ], examples: ["salon-lumiere-naturelle"] },
    { title: "Essayer une palette : murs, linge et mobilier.", paragraphs: [
      "Une couleur fonctionne rarement toute seule. La chambre bleu pétrole associe son mur profond au noyer et au linge blanc. La chambre terracotta combine une terre cuite douce, des textiles écrus et des chevets en bois. Dans les deux cas, la demande indique les éléments à changer et ceux à conserver.",
      "La même logique s’applique à une cuisine : changer les façades, la crédence et les chaises permet d’essayer une autre ambiance sans refaire l’implantation. La version prune et bois conserve notamment la table et les équipements. C’est une projection de décoration, à présenter comme telle."
    ], examples: ["chambre-bleu-petrole", "chambre-terracotta", "cuisine-prune-bois"] },
    { title: "Se projeter dans un aménagement plus complet.", paragraphs: [
      "Sur une terrasse, le mobilier peut rendre les usages plus visibles : deux bains de soleil pour se détendre, une table pour déjeuner. L’exemple en teck explore cette idée en gardant la façade, les marches et les jardinières comme repères.",
      "Dans l’appartement à Spay, la transformation va plus loin : façades bleu profond, parquet et canapé olive. Les vues de la cuisine et du séjour suivent la même direction décorative. Lorsqu’un espace apparaît sur plusieurs photos, relisez les propositions ensemble pour repérer les changements de mobilier ou de matières d’une vue à l’autre."
    ], examples: ["terrasse-mobilier-teck", "cuisine-bleu-parquet", "sejour-canape-olive"] },
    { title: "Une demande claire, puis une vraie comparaison.", paragraphs: [
      "Une bonne demande peut tenir en trois parties : ce qui reste, ce qui change et l’ambiance recherchée. Par exemple : « Garde les ouvertures, le radiateur et le sol. Remplace la table basse et le meuble TV par du noyer, harmonise le tapis et les coussins. Je veux un salon chaleureux avec des matières naturelles. »",
      "Après la proposition, comparez les images à la même échelle. Vérifiez les ouvertures, les lignes de la pièce, les équipements et les détails importants pour vous. Si un seul point ne convient pas, formulez une correction ciblée plutôt que de redéfinir toute la pièce.",
      "Enfin, distinguez la mise en valeur d’une photo d’une projection de travaux ou de décoration. Les nouveaux meubles, peintures et sols présentés dans ces exemples illustrent des possibilités ; ils ne prouvent pas que le logement a été rénové. Cette distinction rend l’avant/après plus compréhensible."
    ] }
  ]
}];
export const publishedArticles = BLOG_ARTICLES.filter(article => article.status === "published").sort((a, b) => b.date.localeCompare(a.date));
export const findArticle = (slug: string) => publishedArticles.find(article => article.slug === slug);
