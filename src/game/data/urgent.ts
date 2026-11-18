import type { EventDef } from "../types";

/**
 * Urgent cards. They turn up in the middle of a day, right after a slot, and
 * are answered against the clock: `urgent.seconds` on the counter, and one of
 * the `urgent.missed` outcomes when it runs out.
 *
 * House rules:
 *  - keep the text short: it is read while the counter runs;
 *  - one choice is safe and small, the other is a gamble on your progress;
 *  - letting the clock run out is never the best answer;
 *  - a choice or a missed outcome that costs money needs a `minCash` guard,
 *    so that a card never ends a run on its own;
 *  - an outcome can deal another card at once with `then`, as the VAT fine
 *    does with its reminders. Such a card is never drawn from the deck and
 *    has no `when`: the first card's `minCash` covers the whole chain.
 */
export const URGENT_CARDS: EventDef[] = [
  {
    id: "prod-down",
    kind: "urgent",
    tone: "bad",
    repeatable: true,
    title: { fr: "La prod est tombée", en: "Production is down" },
    text: {
      fr: "Erreur 500 sur toutes les pages. Tes clients rafraîchissent. Toi aussi.",
      en: "Error 500 on every page. Your customers keep refreshing. So do you.",
    },
    when: { launched: true, minCustomers: 4 },
    urgent: {
      seconds: 6,
      missed: [
        {
          effect: { customers: -1, quality: -4, moral: -8 },
          text: {
            fr: "Une heure de panne. Un client est parti voir ailleurs.",
            en: "An hour of downtime. One customer went to look elsewhere.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Revenir à la version d'hier", en: "Roll back to yesterday" },
        outcomes: [
          {
            effect: { quality: -2 },
            text: {
              fr: "La version d'hier tient. La nouveauté attendra.",
              en: "Yesterday's version holds. The new feature can wait.",
            },
          },
        ],
      },
      {
        label: { fr: "Corriger en direct", en: "Fix it live" },
        outcomes: [
          {
            p: 0.55,
            effect: { quality: 5, moral: 5 },
            text: {
              fr: "Corrigé en quatre minutes. Un client t'envoie un cœur.",
              en: "Fixed in four minutes. A customer sends you a heart.",
            },
          },
          {
            p: 0.45,
            effect: { customers: -1, moral: -6 },
            text: {
              fr: "Ton correctif casse le paiement. Un client s'en va.",
              en: "Your fix breaks the checkout. One customer leaves.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "hn-front",
    kind: "urgent",
    tone: "good",
    repeatable: true,
    title: { fr: "En une de Hacker News", en: "Front page of Hacker News" },
    text: {
      fr: "Quelqu'un a posté ton produit. 4 000 visiteurs arrivent. Ton serveur à 5 € transpire.",
      en: "Someone posted your product. 4,000 visitors are on their way. Your €5 server is sweating.",
    },
    when: { launched: true, minAudience: 60 },
    urgent: {
      seconds: 8,
      missed: [
        {
          effect: { quality: -3, moral: -6 },
          text: {
            fr: "Le site est tombé pendant que tu regardais le compteur. La vague est passée.",
            en: "The site went down while you watched the counter. The wave has passed.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Louer un plus gros serveur (40 €)", en: "Rent a bigger server (€40)" },
        when: { minCash: 40 },
        outcomes: [
          {
            effect: { cash: -40, burst: 1 },
            text: {
              fr: "Le site tient. Les inscriptions suivent.",
              en: "The site holds. The signups follow.",
            },
          },
        ],
      },
      {
        label: { fr: "Croiser les doigts", en: "Cross your fingers" },
        outcomes: [
          {
            p: 0.5,
            effect: { burst: 0.6 },
            text: {
              fr: "Ça tient, de justesse. Une partie des visiteurs s'inscrit.",
              en: "It holds, barely. Some of the visitors sign up.",
            },
          },
          {
            p: 0.5,
            effect: { quality: -5, moral: -5 },
            text: {
              fr: "Le site tombe. Premier commentaire : « ça ne charge pas ».",
              en: "The site goes down. Top comment: “it doesn't load”.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "big-account",
    kind: "urgent",
    tone: "good",
    repeatable: true,
    title: { fr: "Un gros compte pose la question", en: "A big account asks the question" },
    text: {
      fr: "« Vous utilisez quoi pour ça ? » 80 000 abonnés. C'est exactement ton produit.",
      en: "“What do you all use for this?” 80,000 followers. It is exactly your product.",
    },
    when: { hasProject: true },
    urgent: {
      seconds: 6,
      missed: [
        {
          effect: { moral: -4 },
          text: {
            fr: "Tu as hésité sur la formulation. Il y a déjà 300 réponses.",
            en: "You hesitated over the wording. There are 300 replies already.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Répondre en deux mots", en: "Reply in two words" },
        outcomes: [
          {
            effect: { audience: 20, audiencePct: 0.08 },
            text: {
              fr: "Première réponse sous le post. Des curieux cliquent.",
              en: "First reply under the post. Curious people click through.",
            },
          },
        ],
      },
      {
        label: { fr: "Monter une démo vidéo", en: "Cut a demo video" },
        outcomes: [
          {
            p: 0.5,
            effect: { audience: 50, audiencePct: 0.2, moral: 5 },
            text: {
              fr: "Ta démo est épinglée en première réponse.",
              en: "Your demo is pinned as the first reply.",
            },
          },
          {
            p: 0.5,
            effect: { audience: 3, moral: -4 },
            text: {
              fr: "Le temps de monter la vidéo, 212 réponses sont passées devant.",
              en: "By the time the video is cut, 212 replies are ahead of yours.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "domain-expiring",
    kind: "urgent",
    tone: "bad",
    title: { fr: "Ton domaine expire", en: "Your domain is expiring" },
    text: {
      fr: "Rappel n° 7 : ton nom de domaine expire dans une minute. Les six premiers étaient dans les spams.",
      en: "Reminder no. 7: your domain name expires in one minute. The first six were in spam.",
    },
    when: { hasProject: true, minDay: 8 },
    urgent: {
      seconds: 8,
      missed: [
        {
          effect: { audience: -25, moral: -6 },
          text: {
            fr: "Un squatteur a pris ton domaine. Tu repars avec un tiret dans le nom, et moins de monde.",
            en: "A squatter took your domain. You start again with a hyphen in the name, and a smaller crowd.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Renouveler (15 €)", en: "Renew it (€15)" },
        when: { minCash: 15 },
        outcomes: [
          {
            effect: { cash: -15, moral: 1 },
            text: {
              fr: "Renouvelé pour un an. Tu actives enfin le renouvellement automatique.",
              en: "Renewed for a year. You finally switch on auto-renewal.",
            },
          },
        ],
      },
      {
        label: { fr: "Passer au .xyz gratuit", en: "Move to the free .xyz" },
        outcomes: [
          {
            effect: { audience: -12, moral: -2 },
            text: {
              fr: "Nouveau domaine, liens cassés. Une partie de ton audience se perd en route.",
              en: "New domain, broken links. Part of your audience gets lost on the way.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "kebab-happy-hour",
    kind: "urgent",
    tone: "good",
    repeatable: true,
    title: { fr: "Deux pour un chez Chef", en: "Two for one at Chef's" },
    text: {
      fr: "Chef crie dans la rue : deux kebabs pour le prix d'un, pendant six secondes.",
      en: "Chef shouts in the street: two kebabs for the price of one, for six seconds.",
    },
    urgent: {
      seconds: 6,
      missed: [
        {
          effect: { moral: -3 },
          text: {
            fr: "Tu as hésité. Chef a baissé le rideau en te regardant.",
            en: "You hesitated. Chef pulled the shutter down while looking at you.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Descendre en courant (9 €)", en: "Run downstairs (€9)" },
        when: { minCash: 9 },
        outcomes: [
          {
            effect: { cash: -9, faim: 60, moral: 6 },
            text: {
              fr: "Deux kebabs. Tu en gardes un pour ce soir. Il ne tiendra pas jusqu'à ce soir.",
              en: "Two kebabs. You save one for tonight. It will not last until tonight.",
            },
          },
        ],
      },
      {
        label: { fr: "Rester concentré", en: "Stay focused" },
        outcomes: [
          {
            when: { hasProject: true },
            effect: { built: 6 },
            text: {
              fr: "Tu ne lèves pas les yeux. Une fonction de plus.",
              en: "You don't look up. One more function done.",
            },
          },
          {
            when: { hasProject: false },
            effect: { moral: 1 },
            text: {
              fr: "Tu restes à ton bureau. Ton ventre proteste.",
              en: "You stay at your desk. Your stomach objects.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "force-push",
    kind: "urgent",
    tone: "bad",
    repeatable: true,
    title: { fr: "git push --force", en: "git push --force" },
    text: {
      fr: "La commande est partie, sur la branche principale. L'envoi se termine dans une seconde.",
      en: "The command is on its way, on the main branch. The upload ends in one second.",
    },
    when: { hasProject: true, launched: false, minBuilt: 0.25 },
    urgent: {
      seconds: 6,
      missed: [
        {
          effect: { built: -20, moral: -8 },
          text: {
            fr: "Tu as regardé la barre de progression jusqu'au bout. Une journée de code en moins.",
            en: "You watched the progress bar to the end. A day of code is gone.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Ctrl+C !", en: "Ctrl+C!" },
        outcomes: [
          {
            p: 0.65,
            effect: { moral: 4 },
            text: {
              fr: "Annulé à 98 %. Tu jures de ne plus jamais recommencer. Jusqu'à vendredi.",
              en: "Cancelled at 98%. You swear never to do it again. Until Friday.",
            },
          },
          {
            p: 0.35,
            effect: { built: -14, moral: -6 },
            text: {
              fr: "Trop tard d'un cheveu. Une demi-journée de code a disparu.",
              en: "Too late by a hair. Half a day of code is gone.",
            },
          },
        ],
      },
      {
        label: { fr: "Restaurer la sauvegarde", en: "Restore the backup" },
        outcomes: [
          {
            effect: { built: -6 },
            text: {
              fr: "La sauvegarde date d'hier midi. Tu perds un peu, pas tout.",
              en: "The backup is from yesterday noon. You lose a little, not everything.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "runaway-bill",
    kind: "urgent",
    tone: "bad",
    repeatable: true,
    title: { fr: "Boucle infinie chez l'hébergeur", en: "Infinite loop at your host" },
    text: {
      fr: "Alerte de facturation : une fonction s'appelle elle-même. Le compteur grimpe de 3 € par seconde.",
      en: "Billing alert: a function is calling itself. The meter climbs €3 a second.",
    },
    when: { hasProject: true, minCash: 200 },
    urgent: {
      seconds: 8,
      missed: [
        {
          effect: { cash: -140, moral: -6 },
          text: {
            fr: "Le compteur a tourné jusqu'au plafond de ta carte : 140 €.",
            en: "The meter ran up to your card limit: €140.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Tout couper", en: "Shut everything down" },
        outcomes: [
          {
            effect: { cash: -20, moral: -2 },
            text: {
              fr: "Tu débranches tout. 20 € de dégâts et un site éteint pendant une heure.",
              en: "You pull the plug. €20 of damage and a site that is off for an hour.",
            },
          },
        ],
      },
      {
        label: { fr: "Chercher le bug", en: "Hunt the bug" },
        outcomes: [
          {
            p: 0.5,
            effect: { cash: -10, built: 8, moral: 4 },
            text: {
              fr: "Trouvé en trois secondes : une virgule. Tu en profites pour nettoyer le code autour.",
              en: "Found in three seconds: a comma. You tidy the code around it while you are there.",
            },
          },
          {
            p: 0.5,
            effect: { cash: -90, moral: -5 },
            text: {
              fr: "Tu cherches. Le compteur aussi. 90 € plus tard, c'était une virgule.",
              en: "You look for it. So does the meter. €90 later, it was a comma.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "journalist",
    kind: "urgent",
    tone: "good",
    title: { fr: "Une journaliste au téléphone", en: "A journalist on the phone" },
    text: {
      fr: "Elle boucle son article sur les entrepreneurs lillois dans dix minutes. « Votre projet, en une phrase ? »",
      en: "She files her piece on Lille's founders in ten minutes. “Your project, in one sentence?”",
    },
    when: { hasProject: true },
    urgent: {
      seconds: 8,
      missed: [
        {
          effect: { moral: -4 },
          text: {
            fr: "« Allô ? » Elle a raccroché. L'article parlera de ton voisin.",
            en: "“Hello?” She hung up. The piece will be about your neighbour.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Une phrase, sans jargon", en: "One sentence, no jargon" },
        outcomes: [
          {
            p: 0.6,
            effect: { audience: 40, audiencePct: 0.1, moral: 5 },
            text: {
              fr: "Ta phrase est citée telle quelle. Avec le lien.",
              en: "Your sentence is quoted word for word. With the link.",
            },
          },
          {
            p: 0.4,
            effect: { audience: 8 },
            text: {
              fr: "Elle a surtout retenu le mot « kebab ». C'est le titre de l'article.",
              en: "What she kept is the word “kebab”. It is the headline.",
            },
          },
        ],
      },
      {
        label: { fr: "Envoyer le dossier de presse", en: "Send the press kit" },
        outcomes: [
          {
            effect: { audience: 14 },
            text: {
              fr: "Elle n'ouvrira pas la pièce jointe. Ton nom est dans la liste, en bas.",
              en: "She will not open the attachment. Your name is in the list, at the bottom.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "cancel-button",
    kind: "urgent",
    tone: "bad",
    repeatable: true,
    title: { fr: "Le bouton « Résilier »", en: "The Cancel button" },
    text: {
      fr: "Ton plus ancien client vient d'ouvrir la page de résiliation. Son curseur tourne autour du bouton.",
      en: "Your oldest customer just opened the cancellation page. The cursor is circling the button.",
    },
    when: { launched: true, minCustomers: 3 },
    urgent: {
      seconds: 8,
      missed: [
        {
          effect: { customers: -1, moral: -5 },
          text: {
            fr: "Il a cliqué. Motif : « personne ne répond ».",
            en: "He clicked. Reason given: “nobody answers”.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Lui écrire tout de suite", en: "Write to him right away" },
        outcomes: [
          {
            p: 0.6,
            effect: { quality: 2, moral: 5 },
            text: {
              fr: "Il cherchait juste sa facture. Il reste, et te signale un bug au passage.",
              en: "He was only looking for his invoice. He stays, and reports a bug while he is at it.",
            },
          },
          {
            p: 0.4,
            effect: { customers: -1, moral: -4 },
            text: {
              fr: "« Trop tard, j'ai trouvé autre chose. »",
              en: "“Too late, I found something else.”",
            },
          },
        ],
      },
      {
        label: { fr: "Coder ce qu'il demandait", en: "Build what he asked for" },
        outcomes: [
          {
            effect: { skipSlots: 1, quality: 4 },
            text: {
              fr: "Il reste. Ton prochain créneau y passe.",
              en: "He stays. Your next slot goes into it.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "competitor-down",
    kind: "urgent",
    tone: "good",
    title: { fr: "Un concurrent ferme", en: "A competitor shuts down" },
    text: {
      fr: "Ton concurrent annonce sa fermeture. Ses clients cherchent une alternative, là, maintenant.",
      en: "Your competitor announces it is closing. Its customers want an alternative, right now.",
    },
    when: { launched: true },
    urgent: {
      seconds: 6,
      missed: [
        {
          effect: { moral: -3 },
          text: {
            fr: "Ses clients ont trouvé ailleurs. Toi, tu lisais encore l'annonce.",
            en: "Its customers found somewhere else. You were still reading the announcement.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Écrire une page de migration", en: "Write a migration page" },
        outcomes: [
          {
            effect: { skipSlots: 1, burst: 1.2 },
            text: {
              fr: "Ton prochain créneau y passe. Ses clients arrivent avec leurs données.",
              en: "Your next slot goes into it. Its customers arrive with their data.",
            },
          },
        ],
      },
      {
        label: { fr: "Répondre sous l'annonce", en: "Reply under the announcement" },
        outcomes: [
          {
            p: 0.5,
            effect: { burst: 0.6, audience: 15 },
            text: {
              fr: "Ta réponse est la première. Quelques-uns font le saut.",
              en: "Your reply is the first one. A few of them make the jump.",
            },
          },
          {
            p: 0.5,
            effect: { audience: 5, moral: -2 },
            text: {
              fr: "Douze autres concurrents ont répondu avant toi.",
              en: "Twelve other competitors replied before you.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "coffee-spill",
    kind: "urgent",
    tone: "bad",
    repeatable: true,
    title: { fr: "Le café bascule", en: "The coffee tips over" },
    text: {
      fr: "Ta tasse part vers le clavier. Tu as deux mains et une demi-seconde.",
      en: "Your mug is heading for the keyboard. You have two hands and half a second.",
    },
    when: { minCash: 150 },
    urgent: {
      seconds: 6,
      missed: [
        {
          effect: { cash: -80, skipSlots: 1, moral: -3 },
          text: {
            fr: "Tu as regardé la tasse tomber, au ralenti. 80 € de réparation et un créneau perdu.",
            en: "You watched the mug fall, in slow motion. €80 of repairs and a slot lost.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Sauver l'ordinateur", en: "Save the laptop" },
        outcomes: [
          {
            effect: { moral: -2, energie: -4 },
            text: {
              fr: "L'ordinateur est sauf. Le café finit sur ton dernier jean propre.",
              en: "The laptop is safe. The coffee ends up on your last clean jeans.",
            },
          },
        ],
      },
      {
        label: { fr: "Sauver le café", en: "Save the coffee" },
        outcomes: [
          {
            p: 0.5,
            effect: { moral: 6, energie: 6 },
            text: {
              fr: "Tu rattrapes la tasse au vol. Pas une goutte. Personne n'a vu.",
              en: "You catch the mug in mid-air. Not a drop. Nobody saw.",
            },
          },
          {
            p: 0.5,
            effect: { cash: -80, skipSlots: 1 },
            text: {
              fr: "Clavier noyé. 80 € de réparation et un créneau au sèche-cheveux.",
              en: "Drowned keyboard. €80 of repairs and a slot spent with a hairdryer.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "battery",
    kind: "urgent",
    tone: "bad",
    repeatable: true,
    title: { fr: "Batterie à 3 %", en: "Battery at 3%" },
    text: {
      fr: "Coupure de courant dans l'immeuble. Ton travail en cours n'est pas enregistré.",
      en: "Power cut in the building. Your work in progress is not saved.",
    },
    when: { hasProject: true, launched: false, minBuilt: 0.15 },
    urgent: {
      seconds: 6,
      missed: [
        {
          effect: { built: -12, moral: -4 },
          text: {
            fr: "Écran noir. Tu n'avais rien enregistré depuis ce matin.",
            en: "Black screen. You had not saved anything since this morning.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Enregistrer et pousser", en: "Save and push" },
        outcomes: [
          {
            effect: { moral: 2 },
            text: {
              fr: "Poussé à 1 %. L'écran s'éteint sur le message de succès.",
              en: "Pushed at 1%. The screen goes dark on the success message.",
            },
          },
        ],
      },
      {
        label: { fr: "Finir la fonction d'abord", en: "Finish the function first" },
        outcomes: [
          {
            p: 0.5,
            effect: { built: 12, moral: 4 },
            text: {
              fr: "Terminée à la dernière seconde. Elle marche du premier coup.",
              en: "Finished at the last second. It works first time.",
            },
          },
          {
            p: 0.5,
            effect: { built: -12, moral: -5 },
            text: {
              fr: "Écran noir au milieu d'une ligne. Tout est à refaire.",
              en: "Black screen in the middle of a line. It all has to be redone.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "demo-now",
    kind: "urgent",
    tone: "good",
    title: { fr: "Démo dans deux minutes", en: "Demo in two minutes" },
    text: {
      fr: "Un prospect t'écrit : « Je suis dispo maintenant, vous me montrez ? » Ton MVP démarre une fois sur deux.",
      en: "A prospect writes: “I'm free now, can you show me?” Your MVP starts one time in two.",
    },
    when: { hasProject: true, launched: false, minBuilt: 0.3 },
    urgent: {
      seconds: 8,
      missed: [
        {
          effect: { moral: -4 },
          text: {
            fr: "« Finalement, j'ai une réunion. » Il n'a jamais réécrit.",
            en: "“Actually, I have a meeting.” He never wrote again.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Montrer le chantier", en: "Show the building site" },
        outcomes: [
          {
            p: 0.55,
            effect: { mvpCut: 0.3, moral: 5 },
            text: {
              fr: "Il ne regarde qu'un seul écran. Tout le reste, tu peux le couper.",
              en: "He only looks at one screen. Everything else, you can cut.",
            },
          },
          {
            p: 0.45,
            effect: { moral: -6 },
            text: {
              fr: "Écran blanc en plein partage. Il « revient vers toi ».",
              en: "White screen in the middle of the share. He will “circle back”.",
            },
          },
        ],
      },
      {
        label: { fr: "Montrer des maquettes", en: "Show mock-ups" },
        outcomes: [
          {
            effect: { audience: 10 },
            text: {
              fr: "Il hoche la tête et s'inscrit sur la liste d'attente. Avec trois collègues.",
              en: "He nods and joins the waitlist. With three colleagues.",
            },
          },
        ],
      },
    ],
  },
  // The VAT fine and its three reminders. Refusing, or saying nothing, brings
  // the next one at once, with the surcharges French tax law really has: 10,
  // 40, then 80 %. Only the last refusal is a gamble.
  {
    id: "vat-error",
    kind: "urgent",
    tone: "bad",
    title: { fr: "Erreur de TVA", en: "A VAT mistake" },
    text: {
      fr: "Ton comptable s'est trompé de case dans ta déclaration de TVA. Les impôts réclament 120 €, amende comprise, tout de suite. Sa facture à lui était juste.",
      en: "Your accountant ticked the wrong box on your VAT return. The tax office wants €120, fine included, right now. The accountant's own invoice had no mistakes.",
    },
    when: { minDay: 10, minCash: 300 },
    urgent: {
      seconds: 8,
      missed: [
        {
          effect: { moral: -2 },
          then: "vat-reminder",
          text: {
            fr: "Pas de réponse. Pour les impôts, c'est un refus.",
            en: "No answer. To the tax office, that is a no.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Payer (120 €)", en: "Pay (€120)" },
        when: { minCash: 120 },
        outcomes: [
          {
            effect: { cash: -120, moral: -3 },
            text: {
              fr: "Tu paies. Ton comptable t'envoie un pouce levé.",
              en: "You pay. Your accountant sends a thumbs-up.",
            },
          },
        ],
      },
      {
        label: { fr: "Refuser de payer", en: "Refuse to pay" },
        outcomes: [
          {
            effect: {},
            then: "vat-reminder",
            text: {
              fr: "Tu refuses. Le rappel était déjà imprimé.",
              en: "You refuse. The reminder was already printed.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "vat-reminder",
    kind: "urgent",
    tone: "bad",
    title: { fr: "TVA : premier rappel", en: "VAT: first reminder" },
    text: {
      fr: "Le même courrier, en gras. Avec la majoration de 10 %, c'est 132 €, tout de suite.",
      en: "The same letter, in bold. With the 10% surcharge it comes to €132, right now.",
    },
    urgent: {
      seconds: 6,
      missed: [
        {
          effect: { moral: -2 },
          then: "vat-notice",
          text: {
            fr: "Toujours rien. Le courrier suivant part en recommandé.",
            en: "Still nothing. The next letter goes by registered post.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Payer (132 €)", en: "Pay (€132)" },
        when: { minCash: 132 },
        outcomes: [
          {
            effect: { cash: -132, moral: -3 },
            text: {
              fr: "Tu paies. Dire non t'a coûté 12 €.",
              en: "You pay. Saying no cost you €12.",
            },
          },
        ],
      },
      {
        label: { fr: "Refuser encore", en: "Refuse again" },
        outcomes: [
          {
            effect: {},
            then: "vat-notice",
            text: {
              fr: "Tu refuses encore. Ils ont une réserve d'enveloppes à fenêtre.",
              en: "You refuse again. They have plenty of window envelopes.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "vat-notice",
    kind: "urgent",
    tone: "bad",
    title: { fr: "TVA : mise en demeure", en: "VAT: formal notice" },
    text: {
      fr: "Lettre recommandée. Majoration de 40 % : 168 €, tout de suite. Ton comptable est en congés.",
      en: "A registered letter. A 40% surcharge: €168, right now. Your accountant is on holiday.",
    },
    urgent: {
      seconds: 6,
      missed: [
        {
          effect: { moral: -2 },
          then: "vat-seizure",
          text: {
            fr: "Tu n'as pas signé le recommandé. Il compte quand même.",
            en: "You did not sign for the letter. It counts all the same.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Payer (168 €)", en: "Pay (€168)" },
        when: { minCash: 168 },
        outcomes: [
          {
            effect: { cash: -168, moral: -4 },
            text: {
              fr: "Tu paies. Deux refus, 48 € de plus.",
              en: "You pay. Two refusals, €48 more.",
            },
          },
        ],
      },
      {
        label: { fr: "Refuser toujours", en: "Keep refusing" },
        outcomes: [
          {
            effect: {},
            then: "vat-seizure",
            text: {
              fr: "Tu refuses toujours. Ton dossier change d'étage.",
              en: "You keep refusing. Your file moves up a floor.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "vat-seizure",
    kind: "urgent",
    tone: "bad",
    title: { fr: "TVA : dernier avis avant saisie", en: "VAT: final notice before seizure" },
    text: {
      fr: "Majoration de 80 % : 216 €. Après ce courrier, ils se servent sur ton compte.",
      en: "An 80% surcharge: €216. After this letter, they help themselves from your account.",
    },
    urgent: {
      seconds: 6,
      missed: [
        {
          effect: { cash: -236, moral: -6 },
          text: {
            fr: "Saisie sur ton compte : 216 €, plus 20 € de frais de banque.",
            en: "They take it from your account: €216, plus a €20 bank fee.",
          },
        },
      ],
    },
    choices: [
      {
        label: { fr: "Payer (216 €)", en: "Pay (€216)" },
        when: { minCash: 216 },
        outcomes: [
          {
            effect: { cash: -216, moral: -5 },
            text: {
              fr: "Tu paies 216 € pour une case mal cochée.",
              en: "You pay €216 for one wrongly ticked box.",
            },
          },
        ],
      },
      {
        label: { fr: "Refuser jusqu'au bout", en: "Refuse to the end" },
        outcomes: [
          {
            p: 0.35,
            effect: { moral: 8 },
            text: {
              fr: "Ton comptable rappelle enfin : « ah oui, la mauvaise case ». Déclaration corrigée, amende annulée.",
              en: "Your accountant calls back at last: “ah yes, the wrong box.” Return corrected, fine waived.",
            },
          },
          {
            p: 0.65,
            effect: { cash: -236, moral: -6 },
            text: {
              fr: "Saisie sur ton compte : 216 €, plus 20 € de frais de banque.",
              en: "They take it from your account: €216, plus a €20 bank fee.",
            },
          },
        ],
      },
    ],
  },
];
